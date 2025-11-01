#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <fstream>

using namespace std;

// ===================== ITEM CLASS ===================== //
class Item {
public:
    string name;
    int healAmount;
    int attackBoost;
    Item(string n, int h = 0, int a = 0) : name(n), healAmount(h), attackBoost(a) {}
};

// ===================== PLAYER CLASS ===================== //
class Player {
public:
    string name;
    int maxHealth;
    int health;
    int attack;
    int level;
    int xp;
    vector<Item> inventory;

    Player(string n) {
        name = n;
        maxHealth = 100;
        health = maxHealth;
        attack = 10;
        level = 1;
        xp = 0;
        inventory.push_back(Item("Potion", 20));
    }

    void showStats() {
        cout << "\n=== " << name << " Stats ===\n";
        cout << "Level: " << level << "  XP: " << xp << "\n";
        cout << "Health: " << health << "/" << maxHealth << "\n";
        cout << "Attack: " << attack << "\nInventory: ";
        for (size_t i = 0; i < inventory.size(); i++)
            cout << inventory[i].name << " ";
        cout << "\n===================\n";
    }

    void useItem() {
        if (inventory.empty()) {
            cout << "No items available!\n";
            return;
        }
        cout << "Select item to use:\n";
        for (size_t i = 0; i < inventory.size(); i++)
            cout << i+1 << ". " << inventory[i].name << " (Heal: " << inventory[i].healAmount
                 << ", Attack: " << inventory[i].attackBoost << ")\n";
        int choice;
        cin >> choice;
        if (choice < 1 || choice > (int)inventory.size()) {
            cout << "Invalid choice.\n";
            return;
        }
        health += inventory[choice-1].healAmount;
        attack += inventory[choice-1].attackBoost;
        if (health > maxHealth) health = maxHealth;
        cout << "Used " << inventory[choice-1].name << "! Health: " << health
             << "/" << maxHealth << " Attack: " << attack << "\n";
        inventory.erase(inventory.begin() + choice - 1);
    }

    void gainXP(int amount) {
        xp += amount;
        cout << name << " gained " << amount << " XP!\n";
        while (xp >= level*20) {
            xp -= level*20;
            levelUp();
        }
    }

    void levelUp() {
        level++;
        maxHealth += 20;
        attack += 5;
        health = maxHealth;
        cout << "Congrats! " << name << " leveled up to " << level << "!\n";
        cout << "Max Health: " << maxHealth << ", Attack: " << attack << "\n";
    }
};

// ===================== ENEMY CLASS ===================== //
class Enemy {
public:
    string name;
    int health;
    int attack;
    Enemy(string n, int h, int a) : name(n), health(h), attack(a) {}
    void showStats() {
        cout << name << " HP: " << health << "\n";
    }
};

// ===================== BATTLE FUNCTION ===================== //
void battle(Player &player, Enemy &enemy) {
    cout << "\nBattle Start! " << player.name << " vs " << enemy.name << "\n";
    while (player.health > 0 && enemy.health > 0) {
        cout << "1. Attack  2. Use Item  3. Run\nChoice: ";
        int choice;
        cin >> choice;
        if (choice == 1) {
            cout << player.name << " attacks " << enemy.name << " for " << player.attack << " damage!\n";
            enemy.health -= player.attack;
        } else if (choice == 2) {
            player.useItem();
        } else if (choice == 3) {
            cout << player.name << " ran away!\n";
            return;
        } else {
            cout << "Invalid choice!\n";
            continue;
        }
        if (enemy.health <= 0) {
            cout << enemy.name << " defeated!\n";
            player.gainXP(15);
            break;
        }
        cout << enemy.name << " attacks " << player.name << " for " << enemy.attack << " damage!\n";
        player.health -= enemy.attack;
        if (player.health <= 0) {
            cout << player.name << " was defeated!\n";
            break;
        }
    }
}

// ===================== EXPLORE FUNCTION ===================== //
void explore(Player &player) {
    srand(time(0));
    int event = rand() % 5;
    if (event == 0) {
        Enemy goblin("Goblin", 30, 5);
        battle(player, goblin);
    } else if (event == 1) {
        Enemy orc("Orc", 50, 8);
        battle(player, orc);
    } else if (event == 2) {
        Enemy dragon("Dragon", 120, 15);
        battle(player, dragon);
    } else if (event == 3) {
        cout << "You found a potion!\n";
        player.inventory.push_back(Item("Potion", 20));
    } else {
        cout << "Nothing happened...\n";
    }
}

// ===================== SAVE/LOAD ===================== //
void saveGame(Player &player) {
    ofstream file("savegame.txt");
    file << player.name << "\n" << player.health << "\n" << player.maxHealth << "\n"
         << player.attack << "\n" << player.level << "\n" << player.xp << "\n";
    file << player.inventory.size() << "\n";
    for (auto &item : player.inventory)
        file << item.name << " " << item.healAmount << " " << item.attackBoost << "\n";
    file.close();
    cout << "Game saved!\n";
}

void loadGame(Player &player) {
    ifstream file("savegame.txt");
    if (!file.is_open()) {
        cout << "No save game found!\n";
        return;
    }
    int invSize;
    file >> player.name >> player.health >> player.maxHealth >> player.attack >> player.level >> player.xp;
    file >> invSize;
    player.inventory.clear();
    for (int i = 0; i < invSize; i++) {
        string iname;
        int heal, atk;
        file >> iname >> heal >> atk;
        player.inventory.push_back(Item(iname, heal, atk));
    }
    file.close();
    cout << "Game loaded!\n";
}

// ===================== RANDOM EVENTS ===================== //
void randomEvent(Player &player) {
    int r = rand() % 4;
    if (r == 0) {
        cout << "You found a treasure chest!\n";
        player.inventory.push_back(Item("Elixir", 50, 5));
    } else if (r == 1) {
        cout << "A wild enemy ambush!\n";
        Enemy wolf("Wolf", 40, 7);
        battle(player, wolf);
    } else if (r == 2) {
        cout << "You rest for a while and recover 10 health.\n";
        player.health += 10;
        if (player.health > player.maxHealth) player.health = player.maxHealth;
    } else {
        cout << "The area is quiet...\n";
    }
}

// ===================== MAIN MENU ===================== //
int main() {
    Player player("Hero");
    int option = 0;
    while (option != 6) {
        cout << "\n=== MAIN MENU ===\n";
        cout << "1. Show Stats\n2. Explore\n3. Battle Dummy Enemy\n4. Random Event\n5. Save/Load\n6. Exit\nChoice: ";
        cin >> option;
        switch(option) {
            case 1:
                player.showStats();
                break;
            case 2:
                explore(player);
                break;
            case 3: {
                Enemy dummy("Dummy", 50, 7);
                battle(player, dummy);
                break;
            }
            case 4:
                randomEvent(player);
                break;
            case 5: {
                int choice;
                cout << "1. Save\n2. Load\nChoice: ";
                cin >> choice;
                if (choice == 1) saveGame(player);
                else loadGame(player);
                break;
            }
            case 6:
                cout << "Goodbye!\n";
                break;
            default:
                cout << "Invalid choice!\n";
        }
    }
    return 0;
}

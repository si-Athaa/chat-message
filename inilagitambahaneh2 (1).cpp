#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <fstream>

using namespace std;

// ===================== CLASS ===================== //
class Item {
public:
    string name;
    int healAmount;

    Item(string n, int h) : name(n), healAmount(h) {}
};

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
        cout << "=== " << name << " Stats ===" << endl;
        cout << "Level: " << level << "  XP: " << xp << endl;
        cout << "Health: " << health << "/" << maxHealth << endl;
        cout << "Attack: " << attack << endl;
        cout << "Inventory: ";
        for (size_t i = 0; i < inventory.size(); i++) {
            cout << inventory[i].name << " ";
        }
        cout << endl << "===================" << endl;
    }

    void useItem() {
        if (inventory.empty()) {
            cout << "No items available!" << endl;
            return;
        }
        cout << "Select item to use:" << endl;
        for (size_t i = 0; i < inventory.size(); i++) {
            cout << i + 1 << ". " << inventory[i].name << " (Heal: " << inventory[i].healAmount << ")" << endl;
        }
        int choice;
        cin >> choice;
        if (choice < 1 || choice > (int)inventory.size()) {
            cout << "Invalid choice." << endl;
            return;
        }
        health += inventory[choice - 1].healAmount;
        if (health > maxHealth) health = maxHealth;
        cout << "Used " << inventory[choice - 1].name << "! Health is now " << health << "/" << maxHealth << endl;
        inventory.erase(inventory.begin() + choice - 1);
    }

    void gainXP(int amount) {
        xp += amount;
        cout << name << " gained " << amount << " XP!" << endl;
        while (xp >= level * 20) {
            xp -= level * 20;
            levelUp();
        }
    }

    void levelUp() {
        level++;
        maxHealth += 20;
        attack += 5;
        health = maxHealth;
        cout << "Congrats! " << name << " leveled up to " << level << "!" << endl;
        cout << "Max Health: " << maxHealth << ", Attack: " << attack << endl;
    }
};

class Enemy {
public:
    string name;
    int health;
    int attack;

    Enemy(string n, int h, int a) : name(n), health(h), attack(a) {}

    void showStats() {
        cout << name << " HP: " << health << endl;
    }
};

// ===================== FUNCTIONS ===================== //
void battle(Player &player, Enemy &enemy) {
    cout << "Battle Start! " << player.name << " vs " << enemy.name << endl;
    while (player.health > 0 && enemy.health > 0) {
        cout << "1. Attack  2. Use Item  3. Run" << endl;
        int choice;
        cin >> choice;
        if (choice == 1) {
            cout << player.name << " attacks " << enemy.name << " for " << player.attack << " damage!" << endl;
            enemy.health -= player.attack;
        } else if (choice == 2) {
            player.useItem();
        } else if (choice == 3) {
            cout << player.name << " ran away!" << endl;
            return;
        } else {
            cout << "Invalid choice!" << endl;
            continue;
        }
        if (enemy.health <= 0) {
            cout << enemy.name << " is defeated!" << endl;
            player.gainXP(15);
            break;
        }
        cout << enemy.name << " attacks " << player.name << " for " << enemy.attack << " damage!" << endl;
        player.health -= enemy.attack;
        if (player.health <= 0) {
            cout << player.name << " was defeated!" << endl;
            break;
        }
    }
}

void explore(Player &player) {
    srand(time(0));
    int event = rand() % 3;
    if (event == 0) {
        Enemy goblin("Goblin", 30, 5);
        battle(player, goblin);
    } else if (event == 1) {
        cout << "You found a potion!" << endl;
        player.inventory.push_back(Item("Potion", 20));
    } else {
        cout << "Nothing happened..." << endl;
    }
}

void saveGame(Player &player) {
    ofstream file("savegame.txt");
    file << player.name << endl << player.health << endl << player.maxHealth << endl
         << player.attack << endl << player.level << endl << player.xp << endl;
    file << player.inventory.size() << endl;
    for (auto &item : player.inventory) {
        file << item.name << " " << item.healAmount << endl;
    }
    file.close();
    cout << "Game saved!" << endl;
}

void loadGame(Player &player) {
    ifstream file("savegame.txt");
    if (!file.is_open()) {
        cout << "No save game found!" << endl;
        return;
    }
    int invSize;
    file >> player.name >> player.health >> player.maxHealth >> player.attack >> player.level >> player.xp;
    file >> invSize;
    player.inventory.clear();
    for (int i = 0; i < invSize; i++) {
        string iname;
        int heal;
        file >> iname >> heal;
        player.inventory.push_back(Item(iname, heal));
    }
    file.close();
    cout << "Game loaded!" << endl;
}

// ===================== MAIN MENU ===================== //
int main() {
    Player player("Hero");
    int option = 0;
    while (option != 5) {
        cout << "\n=== MAIN MENU ===\n";
        cout << "1. Show Stats\n2. Explore\n3. Battle Dummy Enemy\n4. Save/Load\n5. Exit\nChoose: ";
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
            case 4: {
                int choice;
                cout << "1. Save\n2. Load\nChoose: ";
                cin >> choice;
                if (choice == 1) saveGame(player);
                else loadGame(player);
                break;
            }
            case 5:
                cout << "Goodbye!" << endl;
                break;
            default:
                cout << "Invalid choice!" << endl;
        }
    }
    return 0;
}

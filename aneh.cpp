#include <iostream>
#include <vector>
#include <fstream>
#include <string>
#include <stdexcept>

using namespace std;

// ===== Base Class =====
class Person {
protected:
    string name;
    int age;
public:
    Person(string n, int a) : name(n), age(a) {}
    virtual void display() {
        cout << "Name: " << name << ", Age: " << age << endl;
    }
    virtual ~Person() {}
};

// ===== Student Class =====
class Student : public Person {
    int grade;
public:
    Student(string n, int a, int g) : Person(n, a), grade(g) {}
    void display() override {
        cout << "Student -> Name: " << name << ", Age: " << age << ", Grade: " << grade << endl;
    }
    int getGrade() { return grade; }
};

// ===== Teacher Class =====
class Teacher : public Person {
    string subject;
public:
    Teacher(string n, int a, string s) : Person(n, a), subject(s) {}
    void display() override {
        cout << "Teacher -> Name: " << name << ", Age: " << age << ", Subject: " << subject << endl;
    }
    string getSubject() { return subject; }
};

// ===== School Management =====
class School {
    vector<Student> students;
    vector<Teacher> teachers;
public:
    void addStudent(const Student& s) { students.push_back(s); }
    void addTeacher(const Teacher& t) { teachers.push_back(t); }

    void showAll() {
        cout << "\n--- Students ---\n";
        for (auto &s : students) s.display();
        cout << "\n--- Teachers ---\n";
        for (auto &t : teachers) t.display();
    }

    void saveToFile(const string& filename) {
        ofstream fout(filename);
        if (!fout) throw runtime_error("File tidak bisa dibuka!");
        for (auto &s : students)
            fout << "S," << s.getGrade() << "," << s.getGrade() << endl;
        fout.close();
    }
};

// ===== Main Program =====
int main() {
    School school;

    try {
        school.addStudent(Student("Atha", 18, 90));
        school.addStudent(Student("Budi", 17, 85));
        school.addTeacher(Teacher("Mr. John", 35, "Math"));
        school.addTeacher(Teacher("Ms. Alice", 30, "English"));

        int pilihan;
        do {
            cout << "\nMenu:\n1. Show All\n2. Add Student\n3. Add Teacher\n0. Exit\nPilih: ";
            cin >> pilihan;
            cin.ignore(); // buang newline

            if (pilihan == 1) {
                school.showAll();
            } else if (pilihan == 2) {
                string name;
                int age, grade;
                cout << "Nama Student: "; getline(cin, name);
                cout << "Umur: "; cin >> age;
                cout << "Grade: "; cin >> grade; cin.ignore();
                school.addStudent(Student(name, age, grade));
            } else if (pilihan == 3) {
                string name, subject;
                int age;
                cout << "Nama Teacher: "; getline(cin, name);
                cout << "Umur: "; cin >> age; cin.ignore();
                cout << "Mata Pelajaran: "; getline(cin, subject);
                school.addTeacher(Teacher(name, age, subject));
            }
        } while (pilihan != 0);

    } catch (exception &e) {
        cerr << "Error: " << e.what() << endl;
    }

    cout << "Program selesai." << endl;
    return 0;
}

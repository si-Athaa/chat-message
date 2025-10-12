-- ========================
-- DATABASE: SekolahDB
-- ========================

-- ===== TABLES =====
CREATE TABLE Students (
    StudentID INT PRIMARY KEY,
    Name VARCHAR(100),
    Age INT,
    Grade VARCHAR(10)
);

CREATE TABLE Teachers (
    TeacherID INT PRIMARY KEY,
    Name VARCHAR(100),
    Subject VARCHAR(50)
);

CREATE TABLE Classes (
    ClassID INT PRIMARY KEY,
    ClassName VARCHAR(50),
    TeacherID INT,
    FOREIGN KEY (TeacherID) REFERENCES Teachers(TeacherID)
);

CREATE TABLE Enrollments (
    EnrollmentID INT PRIMARY KEY,
    StudentID INT,
    ClassID INT,
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (ClassID) REFERENCES Classes(ClassID)
);

-- ===== INSERT DATA =====
-- Students
INSERT INTO Students VALUES (1, 'Atha', 18, 'A');
INSERT INTO Students VALUES (2, 'Budi', 17, 'B');
INSERT INTO Students VALUES (3, 'Citra', 18, 'A');
INSERT INTO Students VALUES (4, 'Deni', 16, 'C');
-- Bisa ulang sampe 1000 baris dengan generate script

-- Teachers
INSERT INTO Teachers VALUES (1, 'Mr. John', 'Math');
INSERT INTO Teachers VALUES (2, 'Ms. Alice', 'English');
INSERT INTO Teachers VALUES (3, 'Mr. Bob', 'Physics');

-- Classes
INSERT INTO Classes VALUES (1, 'Math 101', 1);
INSERT INTO Classes VALUES (2, 'English 101', 2);
INSERT INTO Classes VALUES (3, 'Physics 101', 3);

-- Enrollments
INSERT INTO Enrollments VALUES (1, 1, 1);
INSERT INTO Enrollments VALUES (2, 2, 2);
INSERT INTO Enrollments VALUES (3, 3, 3);
INSERT INTO Enrollments VALUES (4, 1, 2);
INSERT INTO Enrollments VALUES (5, 2, 3);

-- ===== VIEW =====
CREATE VIEW StudentGrades AS
SELECT s.Name, s.Grade, c.ClassName, t.Name AS TeacherName
FROM Students s
JOIN Enrollments e ON s.StudentID = e.StudentID
JOIN Classes c ON e.ClassID = c.ClassID
JOIN Teachers t ON c.TeacherID = t.TeacherID;

-- ===== STORED PROCEDURE =====
DELIMITER //
CREATE PROCEDURE GetStudentClasses(IN sid INT)
BEGIN
    SELECT s.Name, c.ClassName, t.Name AS Teacher
    FROM Students s
    JOIN Enrollments e ON s.StudentID = e.StudentID
    JOIN Classes c ON e.ClassID = c.ClassID
    JOIN Teachers t ON c.TeacherID = t.TeacherID
    WHERE s.StudentID = sid;
END //
DELIMITER ;

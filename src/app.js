require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Employee Schema
const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    salary: { type: Number, required: true },
    experience: { type: Number, required: true },
    skills: [String],
    status: { type: String, required: true }
});

const Employee = mongoose.model("Employee", employeeSchema);

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 1. Insert 4 employees
app.get("/seed", async (req, res) => {
    try {
        const employees = [
            {
                employeeId: "E101",
                name: "Arun",
                department: "IT",
                designation: "Developer",
                salary: 40000,
                experience: 2,
                skills: ["Node.js", "MongoDB"],
                status: "Active"
            },
            {
                employeeId: "E102",
                name: "Priya",
                department: "HR",
                designation: "HR Executive",
                salary: 35000,
                experience: 3,
                skills: ["Communication"],
                status: "Active"
            },
            {
                employeeId: "E103",
                name: "Kumar",
                department: "IT",
                designation: "Tester",
                salary: 45000,
                experience: 4,
                skills: ["Testing", "SQL"],
                status: "Active"
            },
            {
                employeeId: "E104",
                name: "Divya",
                department: "Finance",
                designation: "Analyst",
                salary: 50000,
                experience: 5,
                skills: ["Excel"],
                status: "Active"
            }
        ];

        const result = await Employee.insertMany(employees, {
            ordered: false
        });

        res.json({
            message: "Employees inserted successfully",
            count: result.length,
            employees: result
        });
    } catch (err) {
        res.status(500).json({
            message: "Insertion failed. Some employee IDs may already exist.",
            error: err.message
        });
    }
});

// 2. Find employees by department and experience
app.get("/filter", async (req, res) => {
    try {
        const department = req.query.department;
        const experience = Number(req.query.experience);

        const employees = await Employee.find({
            department: department,
            experience: { $gt: experience }
        });

        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Find one employee using employeeId
app.get("/employee/:id", async (req, res) => {
    try {
        const employee = await Employee.findOne({
            employeeId: req.params.id
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Display only name, designation, salary and department
app.get("/summary", async (req, res) => {
    try {
        const employees = await Employee.find(
            {},
            "name designation salary department -_id"
        );

        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update designation and salary
app.put("/employee/:id", async (req, res) => {
    try {
        const employee = await Employee.findOneAndUpdate(
            { employeeId: req.params.id },
            {
                designation: req.body.designation,
                salary: Number(req.body.salary)
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({
            message: "Employee updated successfully",
            employee: employee
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Increase salary of all employees in a department
// Percentage-based increase
app.put("/raise", async (req, res) => {
    try {
        const department = req.body.department;
        const percent = Number(req.body.percent);

        if (!department || !Number.isFinite(percent) || percent < 0) {
            return res.status(400).json({
                message: "Provide a department and valid non-negative percentage"
            });
        }

        const result = await Employee.updateMany(
            { department: department },
            {
                $mul: {
                    salary: 1 + percent / 100
                }
            }
        );

        res.json({
            message: "Department salaries updated",
            matched: result.matchedCount,
            modified: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Find employees within a salary range
app.get("/salary", async (req, res) => {
    try {
        const min = Number(req.query.min);
        const max = Number(req.query.max);

        if (
            req.query.min === undefined ||
            req.query.max === undefined ||
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            min > max
        ) {
            return res.status(400).json({
                message: "Provide a valid minimum and maximum salary"
            });
        }

        const employees = await Employee.find({
            salary: {
                $gte: min,
                $lte: max
            }
        });

        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Delete one employee using employeeId
app.delete("/employee/:id", async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({
            employeeId: req.params.id
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({
            message: "Employee deleted successfully",
            employee: employee
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Display all remaining employees sorted by salary descending
app.get("/employees", async (req, res) => {
    try {
        const employees = await Employee.find().sort({
            salary: -1
        });

        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err.message);
    });
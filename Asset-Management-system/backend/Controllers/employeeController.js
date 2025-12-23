import Employee from "../Models/Employee.js"
import { verifyToken } from "../Utils/jwt.js"
import { sendEmail } from "../Utils/nodemailer.js"

export const addEmployee = async (req, res, next) => {
    try {
        const employeeDetails = new Employee(req.body)
        await employeeDetails.save()
        await sendEmail({
            to: employeeDetails.email,
            subject: "Your Employee Credentials Created Successfully",
            text: `Hi ${employeeDetails.name},
                         Welcome to our company 
                    You can login to the company website using these details
                    empId=${employeeDetails.empId},
                    password=${employeeDetails.password}`
        })
        res.status(201).send({ message: "Employee added" })
    } catch (error) {
        next(error)
    }
}



export const getAllEmployees = async (req, res, next) => {
    try {
        const allEmployees = await Employee.find({},
            { password: 0, __v: 0, _id: 0, createdAt: 0, updatedAt: 0 })
        return res.status(200).send(allEmployees)
    } catch (error) {
        next(error)
    }
}

export const getEmployee = async (req, res, next) => {
    try {
        const { token } = req.cookies
        if (token) {
            const { id } = verifyToken(token)
            if (id) {
                const isEmployee = await Employee.findById(id, { password: 0, __v: 0, _id: 0 })
                if (isEmployee) {
                    return res.status(200).send(isEmployee)
                } else {
                    throw new Error("Invalid User Details")
                }
            } else {
                throw new Error("Unknown Token")
            }
        } else {
            throw new Error("Token Not Found")
        }
    } catch (error) {
        next(error)
    }
}


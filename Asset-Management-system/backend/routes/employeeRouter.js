import express from "express"
import { adminVerify } from "../Middlewares/adminVerify.js"
import { addEmployee, getAllEmployees, getEmployee } from "../Controllers/employeeController.js"



const employeeRouter=express.Router()

//det loggedin employee data

employeeRouter.get("/",getEmployee)
 
employeeRouter.post("/add",adminVerify,addEmployee)

employeeRouter.get("/all",adminVerify,getAllEmployees)

export default employeeRouter;
const errorrHandler=(error,req,res,next)=>{
    // console.log(error.message)

    let statusCode=500
    if(error.message=="Password not matched"){
        statusCode=401
    }
    else if(error.message=="User details Not found"){
    statusCode=400
    }
    else if(error.message=="Provide all the fields"){
        statusCode=400
    }
    return res.status(statusCode).send({error:error.message})
}
export default errorrHandler
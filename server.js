// app.js: Create the API and make it runnable for the future purposes as we might need the API to get the data from the databases

import express from 'express'
import cors from 'cors'
import mysql from 'mysql2'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const app = express();
const port = 3000

//Middleware to parse the JSON bodies
app.use(express.json())
//Enable the CORS here
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

//Middleware to catch the irresponsive or incomplete JSON format
app.use((err,req,res,next)=>{
    if(err instanceof SyntaxError && 'body' in err){
        return res.status(400).json({error: 'Invalid JSON format'});
    }
    next();
})

//Do the MYSQL connection to the database here
const db=mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.user,
    password: process.env.password,
    database: process.env.DB_NAME
})

db.connect((err)=>{
    if(err){
        console.error("Couldn't connect to the database with the following error: "+err)
    }
    else{
        console.log("Connected to the mysql server")
    }
})


/**
 * @description This function is used to check the parameters which are present in the JSON if it is passed in the body
 * @param {*} user_json 
 * @param {*} res 
 */
function checkUserParameters(user_json, res){
    try{
        const username=user_json['username'];
        const email=user_json['email'];
        const password= user_json['password'];
        try{
            const sql=`Insert into users (user_name, user_email, user_password) values('${username}','${email}',sha1('${password}'))`;
            console.log(sql)
            db.execute(sql, (err, result)=>{
                if(err){
                    console.error("Error during executing the query", err);
                    res.status(500).json({error: "Error during executing the query"});
                }
                else{
                    res.status(201).json({ success: true, result: result});
                }
            })
        }   
        catch(Exception){
            console.error("Error in running the query");
            res.status(500).json({error: "Error during executing the query"})
        }
    }
    catch(Exception){
        console.error("Incomplete JSON passed")
        res.status(500).json({error: "Incomplete JSON passed"});
    }    
}

/**
 * @description This function is used to validate the parameters which are present in the JSON body and then triggers for executing the API and giving back
 * response
 * @param {*} item_json 
 * @param {*} res 
 */
function checkItemListParameters(item_json, res){
    try{
        const name=item_json['item_name'];
        const details=item_json['item_details'];
        const category= item_json['item_category'];
        const picture=item_json['item_picture'];
        const price=item_json['item_price'];
        const active=item_json['active'];
        const created_date=item_json['created_date']
        const created_by=item_json['created_by']

        try{
            const sql=`Insert into new_item_details (item_name,item_details,item_category,item_picture,item_price,active,created_date,created_by) values('${name}',"${details}",${category},${picture},${price},${active},'${created_date}',${created_by})`;
            // console.log(sql)
            db.execute(sql, (err, result)=>{
                if(err){
                    console.error("Error during executing the query"+ err);
                    res.status(500).json({error: "Error during executing the query"});
                }
                else{
                    res.status(201).json({ success: true, result: result});
                }
            })
        }   
        catch(Exception){
            console.error("Error in running the query" +err);
            res.status(500).json({error: "Error during executing the query"})
        }
    }
    catch(Exception){
        console.error("Incomplete JSON passed")
        res.status(500).json({error: "Incomplete JSON passed"});
    }    
}
/**
 * ----------------------------------------API section here----------------------------------------------------------------------------
 */

/**
 * Get User details from the users table and it passes on the whole list for now for validation 
 * can use filter for lazy loading later
 */
app.get('/api/users',(req,res)=>{
    const sql= "Select id,user_name From users;";
    db.query(sql, (err, results)=>{
        if(err){
            console.error("Error fetching users: ", err);
            res.status(500).json({error: "Database query failed"});
        }
        else{
            res.json(results)
        }
    })
});

/**
 * Generate SHA1 Hash for the given input
 * @param {*} input 
 * @returns 
 */
function generateSHA1Hash(input){
    return crypto.createHash('sha1').update(input).digest('hex');
}


function validateLogin(res, login){
    const email=login['email'];
    let password=login['password'];

    try{
        if(email===undefined || password===undefined){
            console.error("Incomplete JSON passed");
            res.status(500).json({error: "Incomplete JSON passed"});
        }
        else{
            password=generateSHA1Hash(password);
        }
    }
    catch(Exception){
        console.error("Incomplete JSON passed")
        res.status(500).json({error: "Incomplete JSON passed"});
    }

    const sql= `select user_email,user_password from users`;
    db.execute(sql, (err, result)=>{
        const users= result;
        if(err){
            console.error("Error during executing the query"+ err);
            res.status(500).json({error: "Error during executing the query"});
        }

        //Check if the emails and passwords match
        let isValidUser=false;
        for(let i=0; i<users.length; i++){
            if(users[i].user_email===email && users[i].user_password===password){
                isValidUser=true;
                break;
            }
        }
        if(isValidUser){
            res.status(201).json({ success: true, message: "Login successful"});
        }
        else{
            res.status(401).json({ success: false, message: "Invalid email or password"});
        }
        
    });
}



/**
 * Post of user api for creation of new users
 */
app.post('/api/users',(req,res)=>{
    if(req.body === undefined){
        res.status(400).json({ error: "Invalid format in the body"});
    }
    else{
        //Now add the user in the table: 
        const user_body=req.body;
        const user_details=JSON.stringify(user_body)
        const user_json=JSON.parse(user_details);

        checkUserParameters(user_json, res);
    }
});

// Getting the item category detail here
app.get('/api/item_category',(req,res)=>{
    const sql = "Select * From new_item_category;";
    db.execute(sql, (err, result)=>{
        if(err){
            console.error("Error in fetching the data: "+ err);
            res.status(500).json({error: "Error in fetching the data: "+ err});
        }
        else{
            res.status(201).json(result);
        }
    })
})

/**
 * Get item list which are present in the database
 */
app.get('/api/item_list',(req,res)=>{
    const sql="Select * from new_item_details;"
    db.execute(sql, (err, result)=>{
        if(err){
            console.error("Error during executing the script"+err);
            res.status(500).json({error: "Error during executing the script" +err});
        }
        else{
            res.status(201).json({data: result});
        }
    });
});

/**
 * Add item list in the database and make use of the required parameters and functions
 */
app.post('/api/item_list', (req, res)=>{
    if(req.body==undefined){
        res.status(500).json({ error: "Invalid format in body"});
    }
    else{
        try{
            const req_detail=req.body
            const item_detail=JSON.stringify(req_detail)
            const item_json=JSON.parse(item_detail)

            checkItemListParameters(item_json,res);

        }
        catch(err){
            console.error("Error in JSON format"+err);
            res.status(500).json({error: "Error in JSON format" + err});
        }
    }
});

/**
 * Validate the login and generate the unique session token for the user to login
 */
app.post('/api/login',(req,res)=>{
    if(req.body==undefined){
        res.status(500).json({ error: "Invalid format in body"});
    }
    else{
        try{
                
            const req_detail=req.body
            const login_detail=JSON.stringify(req_detail)
            const login_json=JSON.parse(login_detail)

            validateLogin(res, login_json);
        }
        catch(err){
            console.error("Error in JSON format"+err);
            res.status(500).json({error: "Error in JSON format" + err});
        }
    }
})


//Start the server here and we can use this in the npm package for building the package whenever it is deployed
app.listen(port,()=>{
    console.log(`Sever running on the http://localhost:${port}`);
});


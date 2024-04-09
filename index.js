import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import nodemailer from 'nodemailer';

const app=express();
const port=3000;


app.use(bodyParser.urlencoded({ extended:true }));
app.use(express.static("public"));

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"gstore",
    password:"navaneet",
    port:5432,
});
db.connect();


app.get("/", async(req,res) => {
    res.render("index.ejs");
});

app.get("/login", async(req,res) => {
    res.render("login.ejs");
});

app.get("/signup", async(req,res) => {
    res.render("signup.ejs");
});

app.post("/signupsub", async(req,res) => {
        const us = req.body.username;
        const ps = req.body.password;
        const ad = req.body.address;
        const pn = req.body.pincode;
        const ph = req.body.phoneno;
        
        const result = await db.query("SELECT username FROM info_t  WHERE username=$1",
        [us]
        );
        if(us ==0 || ps ==0 || ad==0 || pn==0 || ph==0 ){
            res.render("signup.ejs",{error:"Enter all and valid information"});
        } else{
            if(result.rows.length==0){
                try{
                    await db.query("INSERT INTO info_t(username,password,address,pincode,phone_no) VALUES($1,$2,$3,$4,$5)",
                [us,ps,ad,pn,ph]
                );
                res.redirect("/");
                } catch(err){
                    res.send("Enter all the information ! Go back");
                    console.log(err);
                    res.redirect("/signupsub");
                }
                } else{
                res.render("signup.ejs",{error:"username already exits"});
            }
        } 
});
app.post("/loginsub", async(req,res) => {
    const name = req.body.name;
    const password = req.body.password;
    const result1 = await db.query("SELECT id FROM info_t WHERE username=$1 AND password=$2",
    [name,password]
    );
    if(result1.rows.length==1){
        const pr = result1.rows[0];
        const result3 = await db.query("SELECT pr_id FROM cart1 WHERE cu_id = $1", [pr.id]);
        const result2 = await db.query("SELECT * FROM product");
        const resp = result2.rows;
        res.render("store.ejs", {info : resp , pinfo : result1.rows[0] , name : name , password : password, ex: result3.rows});
    }else{
        res.render("login.ejs",{error : "Invalid Credetails"});
    }
});

app.post("/addtocart", async (req,res) => {
    const idp = req.body.idd;
    const password = req.body.password;
    const name = req.body.name;
    const itemid = req.body.itemid;
    try
    {await db.query("INSERT INTO cart1(pr_id,cu_id) VALUES($1,$2)",
    [itemid,idp]
    );
    } catch(err){
       console.log("Item already exists")
    }
    const result1 = await db.query("SELECT id FROM info_t WHERE username=$1 AND password=$2",
    [name,password]
    );
    if(result1.rows.length==1){
        const pr = result1.rows[0];
        const result3 = await db.query("SELECT pr_id FROM cart1 WHERE cu_id = $1",[pr.id]);
        const result2 = await db.query("SELECT * FROM product");
        const resp = result2.rows;
        res.render("store.ejs", {info : resp , pinfo : result1.rows[0] , name : name , password : password,ex: result3.rows });
    }else{
        res.render("login.ejs",{error : "Invalid Credetails"});
    }
});

app.post("/gocart", async (req,res) => {
    const id1 = req.body.idd2;
    const result4 = await db.query("SELECT pr_id FROM cart1 WHERE cu_id = $1",[id1]);
    const len =result4.rows
    if(len.length == 0){
        res.render("cart.ejs",{ msg : "No item in cart", id2 : id1 }); 
    } else{
        let arr = [];
        result4.rows.forEach( id => {
        arr = arr.concat(id.pr_id);
        });
        const ids = arr.join(',');
        const result5 = await db.query(`SELECT * FROM PRODUCT WHERE id IN (${ids})`);
        res.render("cart.ejs",{ data : result5.rows , id2 : id1 });
    }
    
});

app.post("/removetocart", async(req,res) => {
    const result6 = req.body.cid;
    const result7 = req.body.pid;
    await db.query("DELETE FROM cart1 WHERE pr_id = $1 AND cu_id = $2",[result7,result6]);
    const result4 = await db.query("SELECT pr_id FROM cart1 WHERE cu_id = $1",[result6]);
    const len =result4.rows
    if( len.length == 0 ){
        res.render("cart.ejs",{ msg : "No item in cart" , id2 : result6});
    } else {
        let arr = [];
    result4.rows.forEach( id => {
        arr = arr.concat(id.pr_id);
    });
    const ids = arr.join(',');
    const result5 = await db.query(`SELECT * FROM PRODUCT WHERE id IN (${ids})`);
    res.render("cart.ejs",{ data : result5.rows , id2 : result6 });
    }
    
});

app.post("/rtostore", async(req,res) => {
    const pr = req.body.cid;
    const result = await db.query("SELECT * FROM info_t WHERE id = $1",[pr]);
    const pr1 = result.rows[0];
    const result3 = await db.query("SELECT pr_id FROM cart1 WHERE cu_id = $1",[pr]);
    const result2 = await db.query("SELECT * FROM product");
    const resp = result2.rows;
    const ar ={
        id : pr
    }
    res.render("store.ejs", {info : resp , pinfo : ar , name : pr1.username , password : pr1.password,ex: result3.rows });
});

app.post("/buy", async(req,res) => {
    const idd = req.body.cid2;
    const result = await db.query("SELECT * FROM info_t WHERE id = $1",[idd]);
    const result1 = await db.query("SELECT * FROM cart1 WHERE cu_id = $1",[idd]);
    const result2 = JSON.stringify(result.rows);
    const result3 = JSON.stringify(result1.rows);
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'navaneetsekar@gmail.com', // Your email address
                pass: 'ryng bxgy lesk swtu' // Your app password
            }
        });

        // Email content
        const mailOptions = {
            from: 'navaneetsekar@gmail.com',
            to: 'navaneetms1404@gmail.com', // Recipient's email address
            subject: 'Order from the customer',
            text: "Informstion about the customer" +result2 +"Information about the product id"+result3
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);

        res.status(200).send('Order placed successfully you will get the delery go back and refresh the cart your cart will be empty');
        await db.query("DELETE FROM cart1 WHERE cu_id=$1",[idd]);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Error sending email');
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
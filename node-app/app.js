
var express=require('express');
var mysql=require('mysql');
var bodyParser=require('body-parser');
var session =require('express-session');
var path=require('path');
var fs=require('fs');
var multer=require('multer');


//establish mysql connection
var connection=mysql.createConnection(
    {
        host:'localhost',
        user:'moiVoice_user',
        password:'moi2021.',
        database:'nodelogin'
    }
);

var app=express();

//use session package to determine if the user is logged in
app.use(session({
   secret:'thisIsASecretCode',
   resave:true,
   saveUninitialized:true 
}));



//use bodyParser package to extract data from html file
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/public',express.static('public'));
app.use('/images', express.static('images'));


//get news-writers login page
app.get('/Newswriters/login.html', function(request, response){
    response.sendFile(path.join(__dirname+'/Newswriters/login.html'));
});



//verify  newswriters login credentials
app.post('/', function(request,response){
    console.log('confirming log in credentials');
    var username=request.body.username;
    var password=request.body.password;

    //check if the user has entered both the username and password
    if(username && password){
        //query mysql table to confirm if the details exist
        connection.query('SELECT *FROM accounts where username =? AND password =?',[username,password],
        function(error,results, fields){
            if(error){
                throw error;
                return;
            }
            if (results.length>0){
                request.session.loggedin=true; //to determine if the client is logged in
                request.session.username=username;
                return response.redirect('/Newswriters/newsPostingPage.html');
    
            }
            else {
                response.send('Incorrect Usename and/or Password!');
            }
            response.end();
        });
    }
    else{
        response.send('please enter Username and Password!');
        response.end();
    }
});



//get page through which news is written 
app.get('/Newswriters/newsPostingPage.html', function(request, response) {
    if (request.session.loggedin) {
        response.send(`<! DOCTYPE html>
                            <head>
                                <title>news Posting page</title>
                                <link rel="stylesheet"
                                      type="text/css"
                                      href="../public/styles/styles.css">

                               
                                    
                            </head>
                            <body class="lavenderBackground">
                                <header>
                                    <div class="pageHead">
                                        <img class="voiceIcon" src="../images/voiceIcon.png">
                                        <h1><b style="color:black">oi</b>Voice</h1>
                                    </div>
                                </header>
                                
                                <form class="whiteBackground" action="/newsUpdate" method="POST" enctype="multipart/form-data">
                                    
                                    <h3> News Writing Page!</h3>
                                    <br>
                                    <div class="flex">
                                        <p>News Section:</p>
                                        <select name="newsSection">
                                            <option value="breaking_news">Breaking News</option>
                                            <option value="admission">Admission </option>
                                            <option value="sports">Sports</option>
                                            <option value="music">Music</option>
                                            <option value="academics">Academics</option>
                                        </select>
                                    </div>

                                    <br>

                                    <div >
                                        <p class="flex">News Headline:</P>
                                        <input type="text" class="flex" name="newsHeadline" placeholder="The news headline"  minlength="8" maxlength="200"required >
                                    </div>

                                    <br>

                                    <div >
                                        <p class="flex">News Article:
                                        <textarea name="newsArticle" rows="70" cols="100">Write the News composition here!</textarea>
                                        </p>
                                    <div>

                                    <div >
                                        <lable class="flex">
                                            select a News photo to upload:
                                            <input type="file" name="newsPhoto" >
                                        </label>
                                    </div>
                                    
                                    <br>
                                    <input type="submit" >
                                   
                                <form>
                            </body>
                       </html>
        `);
        console.log('page set');
        
    } else {
        response.send('Please login to view this page!');
    
    }
    response.end();
});


let date_ob = new Date();

// current date
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);

// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// current year
let year = date_ob.getFullYear();

// current hours
let hours = date_ob.getHours();

// current minutes
let minutes = date_ob.getMinutes();

// current seconds
let seconds = date_ob.getSeconds();

datetime=year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;



//storage of images in uploads
var storage=multer.diskStorage({
    destination: function (request, file, cb){
        cb(null, './public/uploads/')
    },
    filename: function(request,file,cb){
        //the image's name is obtained through combining words of the news headline
        var headline=request.body.newsHeadline;
        var Imagename="";
        
        for(const word in headline.split(" ")){
            Imagename+=headline.split(" ")[word]+"_";
        }
        
        cb(null, Imagename+".png");
    }
});

const fileFilter=(request,file,cb)=>{
    if(file.mimetype=='image/jpeg'|| file.mimetype =='image/jpg' ||file.mimetype=='image/png'){
        cb(null,true);
    }else{
        cb(null,false);
    }
}

var upload=multer({
    storage:storage,
    fileFilter:fileFilter
});




//storage of news data
app.post('/newsUpdate' ,upload.single('newsPhoto'),function(request,response){
    
    var headline=request.body.newsHeadline;
    var newsArticle=request.body.newsArticle;
    var newsSection=request.body.newsSection;



    connection.connect(function(error){
        
        console.log('connected');

        var sql="INSERT INTO "+newsSection+"(headline,body,datetime) VALUES ('"+headline+"','"+newsArticle+"','"+datetime+"')";
        connection.query(sql,function(error,result){
            if (error) throw error;
            console.log('record inserted');
            response.send( 'Data added successfully!');
            
        });
    });

    

});




//load breakingNews page

app.get('/public/breakingNews', function(request, response) {
    connection.query("SELECT `headline`, `body`, `datetime` FROM `breaking_news` ORDER BY id DESC",function(error, result){
        if(error) throw error;
        var article="";
        var newsHeadline="";
        for(const row in result){
            

            article+="<div>";
            for(const column in result[row]){
                
                if(column=="headline"){
                    newsHeadline=result[row][column];
                    
                
                    article+="<h2>"+newsHeadline+"</h2> ";

                    //name of news image is obtained using news headline
                    imageName="";
                    for(const word in newsHeadline.split(" ")){
                        imageName+=newsHeadline.split(" ")[word]+"_";
                    }
                    article+="<img src=./uploads/"+imageName+".png>";
                    
                }

                if(column=="datetime"){
                   
                    article+="<h3>"+datetime+"<h3>";
                }

                if(column=="body"){
                    article+="<p>"+result[row][column]+"</p>";
                }
                

            }
            article+="</div><br><hr>";
        }
        
        
        
        var htmlCode=`<!DOCTYPE html>
        <html>
            <head>
                <title>moiVoice</title>
                <link rel="stylesheet"
                     type="text/css"
                     href="styles/styles.css">
        
                
            </head>
        
            <body>
                <header>
                    <div  style="margin-right:0%; padding-top:25px;" >
                        <img class="voiceIcon" src="/images/voiceIcon.png">
                        <h1><b style="color:black">oi</b>Voice</h1>
                    
                        <a href="../Newswriters/login.html" style="margin-left:600px;
                        font-size:15px;">
                            Login</a>
                    </div>
                    
                    <hr>
                    <nav class="newsSections">
                        <ul>
                            <li><a href="#" class="currentNewsSection">Breaking News</a></li>
                            <li><a href="admission">Admission</a></li>
                            <li><a href="sports">Sports</a></li>
                            <li><a href="music">Music</a></li>
                            <li><a href="academics">Academics</a></li>
                        </ul>
                    </nav>
                </header>
        
                <section>
                    <article>`+article+ `
                    <a href=mailto:\"moivoice@gmail.com\">Review and Criticize via email</a>
                    <br>
                    </article>
                </section>
            
            
            </body>
        
        </html>`
        response.send(htmlCode);
        
    });
});


//load academics page
app.get('/public/academics', function(request, response) {
    connection.query("SELECT `headline`, `body` FROM `academics`",function(error, result){
        if(error) throw error;
        
        //generate article from mysql database
        var article="";
        for(const row in result){
            

            article+="<div>";
            for(const column in result[row]){
                
                if(column=="headline"){
                    newsHeadline=result[row][column];
                    
                
                    article+="<h2>"+newsHeadline+"</h2> ";

                    //name of news image is obtained using news headline
                    imageName="";
                    for(const word in newsHeadline.split(" ")){
                        imageName+=newsHeadline.split(" ")[word]+"_";
                    }
                    article+="<img src=./uploads/"+imageName+".png>";
                    
                }

                if(column=="datetime"){
                   
                    article+="<h3>"+datetime+"<h3>";
                }

                if(column=="body"){
                    article+="<p>"+result[row][column]+"</p>";
                }
                

            }
            article+="</div><br><hr> ";
        }
        
        
        
        var htmlCode=`<!DOCTYPE html>
        <html>
            <head>
                <title>moiVoice</title>
                <link rel="stylesheet"
                     type="text/css"
                     href="styles/styles.css">
        
                
            </head>
        
            <body>
                <header>
                    <div  style="margin-right:0%; padding-top:25px;" >
                        <img class="voiceIcon" src="/images/voiceIcon.png">
                        <h1><b style="color:black">oi</b>Voice</h1>
                    
                        <a href="../Newswriters/login.html" style="margin-left:600px;
                        font-size:15px;">
                            Login</a>
                    </div>
                    
                    <hr>
                    <nav class="newsSections">
                        <ul>
                            <li><a href="breakingNews" >Breaking News</a></li>
                            <li><a href="admission">Admission</a></li>
                            <li><a href="sports">Sports</a></li>
                            <li><a href="music">Music</a></li>
                            <li><a href="#" class="currentNewsSection">Academics</a></li>
                        </ul>
                    </nav>
                </header>
        
                <section>
                    <article>`+article+ `
                    <a href=mailto:\"moivoice@gmail.com\">Review and Criticize via email</a>
                    <br>
                    </article>
                </section>
            
            
            </body>
        
        </html>`
        response.send(htmlCode);
        
    });
});



//load admission page
app.get('/public/admission', function(request, response) {
    connection.query("SELECT `headline`, `body` FROM `admission`",function(error, result){
        if(error) throw error;
        
        var article="";
        for(const row in result){
            

            article+="<div>";
            for(const column in result[row]){
                
                if(column=="headline"){
                    newsHeadline=result[row][column];
                    
                
                    article+="<h2>"+newsHeadline+"</h2> ";

                    //name of news image is obtained using news headline
                    imageName="";
                    for(const word in newsHeadline.split(" ")){
                        imageName+=newsHeadline.split(" ")[word]+"_";
                    }
                    article+="<img src=./uploads/"+imageName+".png>";
                    
                }

                if(column=="datetime"){
                   
                    article+="<h3>"+datetime+"<h3>";
                }

                if(column=="body"){
                    article+="<p>"+result[row][column]+"</p>";
                }
                

            }
            article+="</div><br><hr>";
        }
        
        
        
        var htmlCode=`<!DOCTYPE html>
        <html>
            <head>
                <title>moiVoice</title>
                <link rel="stylesheet"
                     type="text/css"
                     href="styles/styles.css">
        
                
            </head>
        
            <body>
                <header>
                    <div  style="margin-right:0%; padding-top:25px;" >
                        <img class="voiceIcon" src="/images/voiceIcon.png">
                        <h1><b style="color:black">oi</b>Voice</h1>
                    
                        <a href="../Newswriters/login.html" style="margin-left:600px;
                        font-size:15px;">
                            Login</a>
                    </div>
                    
                    <hr>
                    <nav class="newsSections">
                        <ul>
                            <li><a href="breakingNews" >Breaking News</a></li>
                            <li><a href="#" class="currentNewsSection">Admission</a></li>
                            <li><a href="sports">Sports</a></li>
                            <li><a href="music">Music</a></li>
                            <li><a href="academics">Academics</a></li>
                        </ul>
                    </nav>
                </header>
        
                <section>
                    <article>`+article+ `
                    <a href=mailto:\"moivoice@gmail.com\">Review and Criticize via email</a>
                    <br>
                    </article>
                </section>
            
            
            </body>
        
        </html>`
        response.send(htmlCode);
        
    });
});


//load music page
app.get('/public/music', function(request, response) {
    connection.query("SELECT `headline`, `body` FROM `music`",function(error, result){
        if(error) throw error;
        
        var article="";
        for(const row in result){
            

            article+="<div>";
            for(const column in result[row]){
                
                if(column=="headline"){
                    newsHeadline=result[row][column];
                    
                
                    article+="<h2>"+newsHeadline+"</h2> ";

                    //name of news image is obtained using news headline
                    imageName="";
                    for(const word in newsHeadline.split(" ")){
                        imageName+=newsHeadline.split(" ")[word]+"_";
                    }
                    article+="<img src=./uploads/"+imageName+".png>";
                    
                }

                if(column=="datetime"){
                   
                    article+="<h3>"+datetime+"<h3>";
                }

                if(column=="body"){
                    article+="<p>"+result[row][column]+"</p>";
                }
                

            }
            article+="</div><br><hr>";
        }
        
        
        
        var htmlCode=`<!DOCTYPE html>
        <html>
            <head>
                <title>moiVoice</title>
                <link rel="stylesheet"
                     type="text/css"
                     href="styles/styles.css">
        
                
            </head>
        
            <body>
                <header>
                    <div  style="margin-right:0%; padding-top:25px;" >
                        <img class="voiceIcon" src="/images/voiceIcon.png">
                        <h1><b style="color:black">oi</b>Voice</h1>
                    
                        <a href="../Newswriters/login.html" style="margin-left:600px;
                        font-size:15px;">
                            Login</a>
                    </div>
                   
                    <hr>
                    <nav class="newsSections">
                        <ul>
                            <li><a href="breakingNews" >Breaking News</a></li>
                            <li><a href="admission">Admission</a></li>
                            <li><a href="sports.html">Sports</a></li>
                            <li><a href="#" class="currentNewsSection">Music</a></li>
                            <li><a href="academics">Academics</a></li>
                        </ul>
                    </nav>
                </header>
        
                <section>
                    <article>`+article+ `
                    <a href=mailto:\"moivoice@gmail.com\">Review and Criticize via email</a>
                    <br>
                    </article>
                </section>
            
            
            </body>
        
        </html>`
        response.send(htmlCode);
        
    });
});



//load sports page
app.get('/public/sports', function(request, response) {
    connection.query("SELECT `headline`, `body` FROM `sports`",function(error, result){
        if(error) throw error;
        
        var article="";
        for(const row in result){
            

            article+="<div>";
            for(const column in result[row]){
                
                if(column=="headline"){
                    newsHeadline=result[row][column];
                    
                
                    article+="<h2>"+newsHeadline+"</h2> ";

                    //name of news image is obtained using news headline
                    imageName="";
                    for(const word in newsHeadline.split(" ")){
                        imageName+=newsHeadline.split(" ")[word]+"_";
                    }
                    article+="<img src=./uploads/"+imageName+".png>";
                    
                }

                if(column=="datetime"){
                   
                    article+="<h3>"+datetime+"<h3>";
                }

                if(column=="body"){
                    article+="<p>"+result[row][column]+"</p>";
                }
                

            }
            article+="</div><br><hr>";
        }
        
        
        
        var htmlCode=`<!DOCTYPE html>
        <html>
            <head>
                <title>moiVoice</title>
                <link rel="stylesheet"
                     type="text/css"
                     href="styles/styles.css">
        
                
            </head>
        
            <body>
                <header>
                     <div  style="margin-right:0%; padding-top:25px;" >
                        <img class="voiceIcon" src="/images/voiceIcon.png">
                        <h1><b style="color:black">oi</b>Voice</h1>
                    
                        <a href="../Newswriters/login.html" style="margin-left:600px;
                        font-size:15px;">
                            Login</a>
                    </div>
                    
                    <hr>
                    <nav class="newsSections">
                        <ul>
                            <li><a href="breakingNews" >Breaking News</a></li>
                            <li><a href="admission">Admission</a></li>
                            <li><a href="#" class="currentNewsSection">Sports</a></li>
                            <li><a href="music">Music</a></li>
                            <li><a href="academics">Academics</a></li>
                        </ul>
                    </nav>
                </header>
        
                <section>
                    <article>`+article+ `
                    <a href=mailto:\"moivoice@gmail.com\">Review and Criticize via email</a>
                    <br>
                    </article>
                </section>
            
            
            </body>
        
        </html>`
        response.send(htmlCode);
        
    });
});






app.listen(2999);

console.log('listening for port 2999');






































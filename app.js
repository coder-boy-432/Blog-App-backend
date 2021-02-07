var express = require('express');
var app = express();
var bodyParser       = require("body-parser");
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var PORT = process.env.PORT || 4000;


const { Client,Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// db.connect(err => {
//     if(err) {
//         console.log(err);
//     } else {
//         console.log("Connected to pg database");
//     }
// });

db.on('connect', () => {
    console.log("Connected to the database");
})

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// const mysql = require('mysql');

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '1234',
//     database: 'blogSite'
// })

// db.connect((err) => {
//     if(err) {
//         console.log('error connecting');
//         throw err;
//     } else {
//         console.log('mysql connected');
//         blogsUpSt = "DROP TRIGGER IF EXISTS update_blog;"
//         db.query(blogsUpSt, (err,result) => {
//             if(err) {
//                 console.log('init query 1 phase 1 error');
//             } else {
//                 console.log('init query 1 phase 1 done');
//                 blogsUpQ = "create trigger update_blog before update on blogs for each row begin if LENGTH(new.image) < 6 then set new.image = 'https://reactnativecode.com/wp-content/uploads/2018/02/Default_Image_Thumbnail.png'; end if; end";
//                 db.query(blogsUpQ, (err,result) => {
//                     if(err) {
//                         console.log('init query 1 phase 2 error');
//                     } else {
//                         console.log('init query 1 done');
//                     }
//                 });
//             }
//         });
//         blogsInSt = "DROP TRIGGER IF EXISTS insert_blog;"
//         db.query(blogsInSt, (err,result) => {
//             if(err) {
//                 console.log('init query 2 phase 1 error');
//             } else {
//                 console.log('init query 2 phase 2 done');
//                 blogsInQ = "create trigger insert_blog before insert on blogs for each row begin if LENGTH(new.image) < 6 then set new.image = 'https://reactnativecode.com/wp-content/uploads/2018/02/Default_Image_Thumbnail.png'; end if; end";
//                 db.query(blogsInQ, (err,result) => {
//                     if(err) {
//                         console.log('init query 2 phase 2 error');
//                     } else {
//                         console.log('init query 2 done');
//                     }
//                 });
//             }
//         });
//     }
// })

// app.use((req,res,next) => {
// 	res.header('Access-Control-Allow-Origin' , '*');
// 	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, accept, Authorization, accept');
// 	next();
// });
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, accept, Authorization, accept');
    next();
});

app.get('/', (req,res) => {
	res.send("hiiiiiii");
});

app.get('/search/:id', (req,res) => {
    var blogsQ = "select * from blogs where title like ";
    blogsQ = blogsQ + "'%" + req.params.id + "%'";
    blogsQ = blogsQ + " OR content like '%" + req.params.id + "%';";
    console.log(blogsQ);
    db.query(blogsQ, (err,result) => {
        if(err) {
            console.log(err)
            res.status(400).send('got an error on server');
        } else {
            result = result.rows;
            console.log(result);
            res.send(result);
        }
    });
});

app.get('/blog/:id',async (req,res) => {
    console.log('Blog id route reached');
    console.log(req.params.id);
    var blogQ = "select * from blogs where _id = " + req.params.id + ";";
    console.log(blogQ);
    db.query(blogQ,async (err,result) => {
        if(err) {
            console.log("There was an error dude man:");
            console.log(err);
        } else {
            result = result.rows;
            console.log("found blog is: ");
            console.log(result);
            // console.log(result);
            let userQ = "select * from users where _id = " + result[0].authorid + ";";
            console.log(userQ);
            await db.query(userQ, (err2,result2) => {
                if(err2) {
                    console.log("there was an error dude:");
                    console.log(err2);
                } else {
                    result2 = result2.rows;
                    console.log(result2);
                    result[0].author = result2[0].username;
                }
            });
            result[0].likes = 0;
            result[0].dislikes = 0;
            let likeQ = "select count(*) from likedislikes where blogid = " + req.params.id + " AND ldstatus = 1";
            let dislikeQ = "select count(*) from likedislikes where blogid = " + req.params.id + " AND ldstatus = 0";
            // await db.query(likeQ, (err3,result3) => {
            //     if(err3) throw err3;
            //     result3 = result3.rows;
            //     console.log("Likes are:");
            //     console.log(result3)
            //     result[0].likes = parseInt(result3[0].count);
            // });
            // await db.query(dislikeQ, (err4,result4) => {
            //     if(err4) throw err4;
            //     result4 = result4.rows;
            //     console.log("Disikes are:");
            //     console.log(result4);
            //     result[0].dislikes = parseInt(result4[0].count);
            //     // console.log(result[0]);
            //     res.send(result[0]);
            // });

            try {
                let result3 = await db.query(likeQ);
                result3 = result3.rows;
                console.log("Likes are:");
                console.log(result3)
                result[0].likes = parseInt(result3[0].count);

                let result4 = await db.query(dislikeQ);
                result4 = result4.rows;
                console.log("Disikes are:");
                console.log(result4);
                result[0].dislikes = parseInt(result4[0].count);
                res.send(result[0]);
            } catch(err) {
                console.log("there was an error: ");
                console.log(err);
            }
        }
        
        // let ldQ = "select ldstatus,count(*) from likedislikes where blogid = " + req.params.id + "group by ldstatus;";
        // res.send(result[0]);
    })
});

app.get('/blog/:id/comments',async (req,res) => {
    console.log("comments route reached");
    let findQ = "select *  from comments where blogid = " + req.params.id + ";";
    db.query(findQ,async (err,result) => {
        if(err) {
            console.log(err.code);
            res.status(400).send('got an error on server');
        } else {
            result = result.rows;
            console.log(result);
            if(result.length > 0) {
                for(let index = 0; index < result.length; index++) {
                    let likeQ = "select count(*) from commentsLD where commentid = " + result[index]._id + " AND ldstatus = 1";
                    let dislikeQ = "select count(*) from commentsLD where commentid = " + result[index]._id + " AND ldstatus = 0";
                    
                    
                    // await db.query(likeQ, (err3,result3) => {
                    //     if(err3) throw err3;
                    //     result3 = result3.rows;
                    //     // console.log(result3)

                    //     console.log(result3);
                    //     result[index].likes = parseInt(result3[0].count);
                        
                    //     // console.log(result[index]);
                    // });                    
                    // await db.query(dislikeQ, (err4,result4) => {
                    //     if(err4) throw err4;
                    //     result4 = result4.rows;
                    //     // console.log(result4);
                        
                    //     result[index].dislikes = parseInt(result4[0].count);

                    //     // console.log(result[index]);
                    // });

                    try{
                        let result3 = await db.query(likeQ);
                        result3 = result3.rows;
                        result[index].likes = parseInt(result3[0].count);

                        let result4 = await db.query(dislikeQ);
                        result4 = result4.rows;
                        result[index].dislikes = parseInt(result4[0].count);
                    } catch (err) {
                        console.log("there was an error: ");
                        console.log(err);
                    }

                    let findName = 'select * from users where _id = ' + result[index].userid + ";";
                    await db.query(findName,async (err2,result2) => {
                        if(err) {
                            console.log(err2.code);
                            res.status(400).send('got an error on server');
                        } else {
                            result2 = result2.rows;
                            result[index].name = result2[0].username;
                            console.log(result[index]);
                            if(index === result.length - 1) {
                                res.send(result);
                            }
                        }
                    })
                };
            } else {
                res.send([]);
            }
            // console.log("result aa gaya bhaiyya");
            // res.send(result);
        }
    })
})

app.post('/blog/:id/edit', verifyToken,(req,res) => {
    console.log('edit route reached');
    console.log(req.params.id);
    console.log(req.body);

    console.log(req.authData);
    // if(req.authData.foundUser._id !== ){
    //     res.sendStatus(403)
    // }
    // var createQ = "insert into blogs values(NULL,"
    // createQ = createQ + "'" + req.body.title + "'" + ",";
    // createQ = createQ + "'" + req.body.image + "'" + ",";
    // createQ = createQ + "'" + req.body.blogContent + "'" + ",";
    // createQ = createQ + "'" + req.body.category + "'" + ",";
    let updateQ = "update blogs set ";
    updateQ = updateQ + "title = '" + req.body.title + "',";
    updateQ = updateQ + "image = '" + req.body.image + "',";
    updateQ = updateQ + "content = '" + req.body.blogContent + "',";
    updateQ = updateQ + "category = '" + req.body.category + "'";
    updateQ = updateQ + " where _id = " + req.body._id + ";";

    // createQ = createQ + "'" + req.authData.foundUser._id + "'" + ");";
    // createQ = createQ + req.authData.foundUser._id + ");";
    console.log(updateQ);
    db.query(updateQ, (err,result) => {
        if(err) throw err;
        console.log(result);
        res.send({
            updateStatus: true
        })
    })
})

app.get('/blog/:id/delete', verifyToken,(req,res) => {
    console.log('delete route reached');
    console.log(req.params.id);
    let deleteQ = 'delete from blogs where _id = ' + req.params.id + ' ;';
    console.log(deleteQ);
    db.query(deleteQ, (err,result) => {
        if(err) {
            console.log(err);
            res.status(400).send('Already liked or disliked');
        } else {
            console.log(result);
            res.send({executionStatus: true});
        }
    })
})

app.post('/blog/:id/addcomment', verifyToken, (req,res) => {
    console.log("comment route reached");
    console.log(req.params.id);
    let createQ = "insert into comments values(DEFAULT,";
    createQ = createQ + req.params.id + ",";
    createQ = createQ + req.authData.foundUser._id + ",";
    createQ = createQ + "'" + req.body.content + "') returning _id ;";
    findQ = "select * from comments where _id = ";
    db.query(createQ, (err,result) => {
        if(err) {
            console.log(err.code)
            res.status(400).send('Already liked or disliked');
        } else {
            console.log("Added comment iD is...");
            console.log(result.rows[0]._id);
            findQ = findQ + result.rows[0]._id + ";";
            db.query(findQ,async (err2,result2) => {
                if(err) {
                    console.log(err2.code);
                    res.status(400).send('got an error on server');
                } else {
                    console.log("Found comment is ....");
                    console.log(result2.rows[0]);
                    result2 = result2.rows;
                    result2[0].name = req.authData.foundUser.username;
                    result2[0].likes = 0;
                    result2[0].dislikes = 0;
                    res.send(result2[0]);
                }
            })
        }
    });
});

app.get('/comment/like/:id', verifyToken, (req,res) => {
    let boolNo = 1
    let createQ = "insert into commentsLD values(";
    createQ = createQ + req.params.id + ",";
    createQ = createQ + req.authData.foundUser._id  + ",";
    createQ = createQ + boolNo + ");";
    db.query(createQ, (err,result) => {
        if(err) {
            console.log(err.code)
            res.status(400).send('Already liked or disliked');
        } else {
            console.log(result);
            res.send({executionStatus: true});
        }
    })
});

app.get('/comment/dislike/:id', verifyToken, (req,res) => {
    let boolNo = 0
    let createQ = "insert into commentsLD values(";
    createQ = createQ + req.params.id + ",";
    createQ = createQ + req.authData.foundUser._id  + ",";
    createQ = createQ + boolNo + ");";
    db.query(createQ, (err,result) => {
        if(err) {
            console.log(err.code);
            res.status(400).send('Already liked or disliked');
        } else {
            console.log(result);
            res.send({executionStatus: true});
        }
    })
});

app.get('/like/:id', verifyToken, (req,res) => {
    let boolNo = 1
    let createQ = "insert into likedislikes values(";
    createQ = createQ + req.params.id + ",";
    createQ = createQ + req.authData.foundUser._id  + ",";
    createQ = createQ + boolNo + ");";
    db.query(createQ, (err,result) => {
        if(err) {
            console.log(err.code)
            res.status(400).send('Already liked or disliked');
        } else {
            console.log(result);
            res.send({executionStatus: true});
        }
    })
});

app.get('/dislike/:id', verifyToken, (req,res) => {
    let boolNo = 0
    let createQ = "insert into likedislikes values(";
    createQ = createQ + req.params.id + ",";
    createQ = createQ + req.authData.foundUser._id  + ",";
    createQ = createQ + boolNo + ");";
    db.query(createQ, (err,result) => {
        if(err) {
            console.log(err.code);
            res.status(400).send('Already liked or disliked');
        } else {
            console.log(result);
            res.send({executionStatus: true});
        }
    })
});

app.get('/blogsList', (req,res) => {
    console.log("reached blogsList route");
    var fetchQ = "select * from blogs";
    db.query(fetchQ, (err,result) => {
        // if(err) throw err;
        // console.log(result);
        // res.send(result);
        if(err) {
            console.log("there was an error");
            console.log(err);
        } else {
            result = result.rows;
            console.log("got a result back");
            console.log(result);
            res.send(result);
        }
    })
});

app.get('/getmyblogs', verifyToken,(req,res) => {
    var fetchQ = "select * from blogs where authorid = " + req.authData.foundUser._id + ";";
    db.query(fetchQ, (err,result) => {
        if(err) throw err;
        result = result.rows;
        console.log(result);
        res.send(result);
    })
})

app.get('/blogsbycat/:id', (req,res) => {
    let fetchQ = "select * from blogs where category = " + "'" + req.params.id + "';";
    db.query(fetchQ, (err,result) => {
        // if(err) throw err;
        // result = result.rows;
        // console.log(result);
        // res.send(result);
        if(err) {
            console.log("there was an error");
            console.log(err);
        } else {
            result = result.rows;
            console.log(result);
            res.send(result);
        }
    })
});

app.post('/createblog', verifyToken, (req,res) => {
    console.log('reached create blog route');
    console.log(req.authData);
    var createQ = "insert into blogs values(DEFAULT,"
    createQ = createQ + "'" + req.body.title + "'" + ",";
    createQ = createQ + "'" + req.body.image + "'" + ",";
    createQ = createQ + "'" + req.body.blogContent + "'" + ",";
    createQ = createQ + "'" + req.body.category + "'" + ",";
    // createQ = createQ + "'" + req.authData.foundUser._id + "'" + ");";
    createQ = createQ + req.authData.foundUser._id + ");";
    console.log(createQ);
    db.query(createQ, (err,result) => {
        if(err) throw err;
        console.log(result);
        res.send({
            createStatus: true
        })
    })
});

app.post('/auth/login', async (req,res) => {
    console.log('reached login route');
    var Query = "select * from users where username = ";
    Query = Query + "'" + req.body.username + "' AND email = ";
    Query = Query + "'" + req.body.email + "';";
    db.query(Query, (err, result) => {
        if(err) {
            console.log("There was an error");
            console.log(err);
        } else {
            result = result.rows;
            console.log(result);
            bcrypt.compare(req.body.password, result[0].password, (err,result2) => {
                if(err) {
                    console.log('There was an error');
                    res.status(400).send('there was an error');
                } else {
                    if(result2) {
                        let foundUser = result[0];
                        console.log("found user is....");
                        console.log(foundUser);
                        delete foundUser.password;
                        jwt.sign({foundUser},'secretKey',(err,token) => {
                            res.send({
                                username: foundUser.username,
                                idToken: token,
                                localId: foundUser._id,
                                expiresIn: 3600
                            });
                        });
                    } else {
                        console.log('Wrong Password');
                        res.status(400).send('Wrong password');
                    }
                }
            });
        }
    });
});

app.post('/auth/signup',async (req,res) => {
    console.log('reached signup route');
	// const salt = await bcrypt.genSalt();
	const hashedPassword = await bcrypt.hash(req.body.password, 10);
	// const foundUser = {
	// 	username: req.body.username,
	// 	email: req.body.email,
    //     password: hashedPassword,
    //     _id: 1234
    // }
    var sqlQuery = 'insert into users values(DEFAULT,';
    sqlQuery = sqlQuery + "'" + req.body.username + "'" + ",";
    sqlQuery = sqlQuery + "'" + req.body.email + "'" + ",";
    sqlQuery = sqlQuery + "'" + hashedPassword + "'" + ") returning _id ;";

    var Query = "select * from users where username = " + "'" + req.body.username + "';";

    console.log('sqlQuery is .....');
    console.log(sqlQuery);
    console.log(Query);

    await db.query(sqlQuery, (err,result1) => {
        if(err) {
            console.log("There was an error");
            console.log(err);
        } else {
            console.log(result1);
            result1 = result1.rows;
            console.log('First result is....');
            console.log(result1);
            db.query(Query, (err,result) => {
                if(err) {
                    console.log("There was an error man:");
                    console.log(err);
                } else {
                    result = result.rows;
                    console.log('second result is....');
                    const foundUser = result[0];
                    console.log(result);
                    delete foundUser.password;
                    jwt.sign({foundUser},'secretKey',(err,token) => {
                        console.log('Sending token....');
                        res.send({
                            username: foundUser.username,
                            idToken: token,
                            localId: foundUser._id,
                            expiresIn: 3600
                        });
                    });
                }
            });
        }
    });

	// console.log(hashedPassword);
	// jwt.sign({foundUser},'secretKey',(err,token) => {
    //     console.log('Sending token....');
    //     res.send({
    //         username: foundUser.username,
    //         idToken: token,
    //         localId: foundUser._id,
    //         expiresIn: 3600
    //     });
    // });
	
});

async function verifyToken(req,res,next) {
	console.log('reached middleware');
	const bearerHeader = req.headers['authorization'];
	if(bearerHeader) {
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];
		await jwt.verify(bearerToken, 'secretKey', (err,authData) => {
			if(err) {
				res.sendStatus(403)
			} else {
                req.authData = authData;
                console.log("authdata is ....");
                console.log(authData);
			}
		});
		req.token = bearerToken;
		next();
	} else {
		res.sendStatus(401);
	}
}


app.listen(PORT, () => {
	console.log('listening on port 5000');
});
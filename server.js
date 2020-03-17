var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
  process.exit(1);
}
var server = http.createServer(function(request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/

  console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);
  ////////////////////////////sign_in/////////////////////////
  if (path === "/sign_in.html" && method === "POST") {
    const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    const array = [];
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    request.on("data", chunk => {
      array.push(chunk);
    });
    request.on("end", () => {
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      const user = userArray.find(
        user => user.name === obj.name && user.password === obj.password
      );
      if (user === undefined) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "text/json;charset=utf-8");
        response.end(`{"errorCode":4001}`);
      } else {
        response.statusCode = 200;
        const random = Math.random();
        const session = JSON.parse(
          fs.readFileSync("./public/session.json").toString()
        );
        session[random] = { user_id: user.id };
        fs.writeFileSync("./public/session.json", JSON.stringify(session));
        console.log(session);
        response.setHeader("Set-Cookie", `session_id=${random}`, "HttpOnly");
        response.end();
      }
    });
    ////////////////////////////sign_in/////////////////////////
    ////////////////////////////home////////////////////////////
  } else if (path === "/home.html") {
    const cookie = request.headers["cookie"];
    // sessionId为随机数;
    let sessionId;
    try {
      sessionId = cookie
        .split(";")
        .filter(s => s.indexOf("session_id=") >= 0)[0]
        .split("=")[1];
      console.log(sessionId);
    } catch (error) {}
    const session = JSON.parse(
      fs.readFileSync("./public/session.json").toString()
    );
    const homeHtml = fs.readFileSync("./public/home.html").toString();
    let string = "";
    if (sessionId && session[sessionId]) {
      const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
      const userId = session[sessionId].user_id;
      const user = userArray.find(user => user.id === userId);
      if (user) {
        string = homeHtml
          .replace("{{loginStatus}}", "已登录")
          .replace("{{userName}}", user.name);
        response.write(string);
        response.end();
      }
    } else {
      string = homeHtml
        .replace("{{loginStatus}}", "未登录")
        .replace("{{userName}}", "");
      response.write(string);
      response.end();
    }

    ////////////////////////////home////////////////////////////
    ////////////////////////////register/////////////////////////
  } else if (path === "/register.html" && method === "POST") {
    console.log("fuck");
    const array = [];
    const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    request.on("data", chunk => {
      array.push(chunk);
    });
    request.on("end", () => {
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      const lastUser = userArray[userArray.length - 1];
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password
      };
      const user = userArray.find(user => user.name === obj.name);
      // userArray.push(newUser);
      if (user || obj.name === "" || obj.password === "") {
        response.statusCode = 400;
        response.end();
      } else {
        userArray.push(newUser);
        fs.writeFileSync("./db/users.json", JSON.stringify(userArray));
        response.end();
      }
    });
    ////////////////////////////register/////////////////////////
    ///////////////////////////静态服务器//////////////////////////
  } else {
    const filePath = path === "/" ? "/index.html" : path;
    const index = filePath.lastIndexOf(".");
    const suffix = filePath.substring(index);
    const fileTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "text/json",
      ".png": "image/png",
      ".jpg": "image/jpeg"
    };
    response.statusCode = 200;
    response.setHeader(
      "Content-Type",
      `${fileTypes[suffix] || "text/html"};charset=utf-8`
    );
    //默认首页
    let content;
    try {
      content = fs.readFileSync(`./public${filePath}`);
    } catch (error) {
      content = "文件不存在";
      response.statusCode = 404;
    }
    response.write(content);
    response.end();
  }
});
///////////////////////////静态服务器//////////////////////////
/******** 代码结束，下面不要看 ************/

server.listen(port);
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);

app.use(routerQuotes.routes());
app.use(routerQuotes.allowedMethods());
//--- Users
app.use(routerUsers.routes());
app.use(routerUsers.allowedMethods());

app.use(NotFound);

//--- sha256("acardosojmz", "utf8", "hex");

//--- `(alt + }) 
console.log(`Server running on port ${PORT}`  );
app.listen(`${HOST}:${PORT}`);




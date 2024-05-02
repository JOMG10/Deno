//--- conectors.ts

import { MongoClient, ClientMariaDB } 
    from "../dependences.ts";


const mongoClient = new MongoClient();
const URI_MONGO="mongodb://itvoDeveloper:t0ps3cr3t@127.0.0.1:27017/quotes?authMechanism=SCRAM-SHA-256&authSource=admin";
export const connectorMongoDB = await mongoClient.connect(URI_MONGO);

const CONN_MARIADB = {
    hostname: "127.0.0.1",
    port: 3306,
    username: "devDeno",
    password: "t0ps3cr3t",
    db: "quotes",
    poolSize: 10};

export const connectorMariaDB = await new ClientMariaDB().connect(CONN_MARIADB);
//console.log(await connectorMariaDB.query(`SELECT * FROM user`));
_______________________________________________________________________________________

  // --- Controllers/QuoteController.ts

  import quoteService  from "../services/QuoteService.ts";

  import { Status } from "../dependences.ts";

  /**
   * @desc  Returns all list quotes
   * @route   GET /api/v1/quotes
   * @returns list quotes
   */

  export const getQuotes = async ( 
      {request, response}: { request: any, response: any },
      ) => {


      const pageParameter =  parseInt(request.url.searchParams.get("page")) || 1;
      const sizeParameter =  parseInt(request.url.searchParams.get("size")) || 50;

      const page = pageParameter<1?1:pageParameter; 
      const size = sizeParameter<5?5:sizeParameter; 

      const quotes= await quoteService.getQuotes(page, size);

      response.status = Status.OK;
      response.body = {
          success: true,
          message: "Retrive list quotes",
          data: quotes,
      };
  };

  /**
   * @desc  get single quote by id
   * @route GET /api/v1/quote/:id
   * @param id - The parameter url
   * @returns quote
   */

  export const getQuote = async (
      {params, response}: { params: { id: string }; response: any },
  ) => {

      const quote = await quoteService.getQuote(
          Number(params.id),
      );

      //console.log(quote.toString);

      if (quote.length) {
          response.status = Status.OK;
          response.body = {
              success: true,
              message: "quote",
              data: quote,
          };
          return;
      }
      response.status = Status.BadRequest;
      response.body = {
          success: false,
          message: `Quote with id: ${params.id} not found`,
          data: [],
      }
  };

  /**
   * @desc  add quote
   * @route   POST /api/v1/quotes
   * @param {"quote":"value","author":"value"}
   * @returns data new quote
   */

  export const addQuote = async (
      {request, response}: { request: any; response: any },
  ) => {

      if (request.body()){
          const data = await request.body().value;
          if (data.quote && data.author && data.id){
              const quote = await quoteService.createQuote( data );

              response.status = Status.Created;
              response.body = {
                  success: true,
                  message: "save quote successfull", 
                  data: [quote],
              };
              return;
          }
      }

      response.status = Status.BadRequest;
      response.body = {
          success: false,
          message: "The request must have the citation and author.",
          data: [],
      };
  };

  /**
   * @desc  update quote
   * @route   PUT /api/v1/quotes/:id
   * @param id - The parameter url
   * @param request.body {"quote":"value", "author":"value"} OR {"quote":"value"}  OR "author":"value" 
   * @returns quote updated or message quote not found
   */

  export const updateQuote = async (
      {params, request, response}: {
          params: { id: string };
          request: any;
          response: any;
      },
  ) => {
      const currentQuote = await quoteService.getQuote(
          Number(params.id),
      );

      if (currentQuote.length){
          const data = await request.body().value;

          if (data.quote || data.author) {
              const updatedQuote = await quoteService.updateQuote(
                  Number(params.id),
                  {"id":Number(params.id,), 
                  "quote":data.quote,
                  "author":data.author },
              );
              if (updatedQuote) {
                  response.status = Status.OK;
                  response.body = {
                      success: true,
                      message: `Update for quote with id ${params.id} was successful`,
                      data: updatedQuote, 
                  };
                  return;
              }

              response.status = Status.InternalServerError;
              response.body = {
                  success: false,
                  message: `Update for quote with id ${params.id} failed`,
                  data: [], 
              };
              return; 
          }
          response.status = Status.BadRequest;
          response.body = {
              success: false,
              message: "The request must have the citation or author.",
              data: [], 
          };
          return;
      }
      response.status = Status.NotFound;
      response.body = {
          success: false,
          message: `Quote with id: ${params.id} not found`,
          data: [], 
      };
  };

  /**
   * @desc  delete quote
   * @route   DELETE /api/v1/quotes/:id
   * @param id - The parameter url
   * @returns confirm quote deleted OR message  quote not found
   */

  export const deleteQuote = async (
      {params, response}: { params: { id: string }; response: any },
  ) => {
      const quote = await quoteService.deleteQuote(
          Number(params.id),
      );

      const message = !quote.length?"Quote not found":"Quote removed";

      response.body = {
          success: quote.length !== 0,
          message: message,
          data: quote,
      };

  };

__________________________________________________________
//--- services/QuoteService.ts
import { default as quoteRepository } 
    from "../repositories/QuoteRepository.ts";
import { Quote } from "../interfaces/Quote.ts";

class QuoteService {

    getQuotes  =  async(page: number, size: number) => {
        return await quoteRepository.getQuotes(page, size);
    };

      
    getQuoteByoid = async (oid: string) =>{
       return await quoteRepository.getQuoteByoid(oid);
    }
    
    getQuote = async (id: number) => {
        return await quoteRepository.getQuote(id);
    }
    
    createQuote = async (quote: Quote) => {
        return await quoteRepository.addQuote(quote);
            
    };

    updateQuote = async (id: number, quote: Quote, ) => {
        return  await quoteRepository.updateQuote(id,quote);
    };

    deleteQuote = async (id: number) => {
        return await quoteRepository.deleteQuote(id);
    };
}

export default new QuoteService();
____________________________________________________________________


//--- repositories/QuoteRepository.ts
import { Quote } from "../interfaces/Quote.ts";
import { QuoteModel } from "../models/QuoteModel.ts";

class QuoteRepository { 

    async getQuotes(page: number, size: number)  { 

        const cursor = QuoteModel.find();
        //--- paginate
        cursor.skip((page-1) * size)
                       .limit(page*size);

        return  await cursor.toArray(); 
    } 
   
    async getQuoteByoid(oid: string) { 
        return await QuoteModel.findOne({"_id":oid}); 
    } 
    
    async getQuote(quoteId: number) { 
        return  await QuoteModel.find({id: quoteId} ).toArray();
    } 

    async addQuote(quote: Quote) { 
        await QuoteModel.insertOne(quote);
        return quote;
    }

    

    async updateQuote(id: number, quote: Quote) { 
        await QuoteModel.updateOne(
            { "id": id},
                { $set: {
                    id: quote.id, 
                    quote: quote.quote,
                    author: quote.author
                } 
            },
          );
        let quoteUpdated= await  this.getQuote(id);
        return quoteUpdated;
    }

    async deleteQuote(id: number) {    
        const quote= await this.getQuote(id) ;
        await QuoteModel.deleteOne({ "id": id });
        return quote;
    }

} 

export default new QuoteRepository();

____________________________________________
//--- models/QuoteModel.ts
import { connectorMongoDB } 
    from "../config/connectors.ts";  

import { Quote } 
from "../interfaces/Quote.ts";    


export const QuoteModel = connectorMongoDB.collection<Quote>("quote");

______________________________________________________________________________
//--- interfaces/Quote.ts
export interface Quote {
  id: number;
  quote: string;
  author: string;
  
}

*******************************

//--- dependences.ts

import { Application, Router, Context  } 
    from "https://deno.land/x/oak/mod.ts";

import { Status, STATUS_TEXT } 
    from "https://deno.land/std/http/http_status.ts";

import { expect } 
    from "https://deno.land/x/expect/mod.ts";

	
import {
    getNumericDate,
    create as jwtCreate,
    decode as jwtDecode,
    verify as jwtVerify
} from "https://deno.land/x/djwt/mod.ts";   

import type { Header as jwtHeader, 
    Payload as  jwtPayload } 
    from "https://deno.land/x/djwt/mod.ts";


import { config } 
    from "https://deno.land/x/dotenv/mod.ts";

import  sha512 
    from "./utils/sha512.ts";
    
import {
    Bson,
    MongoClient,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";

import { Client as ClientMariaDB } from "https://deno.land/x/mysql/mod.ts";


export const { JWT_SECRET } = config({ safe: true });


export { Application, Router, Context, Status, 
    STATUS_TEXT, expect,
    getNumericDate, jwtCreate, jwtDecode, jwtVerify, 
    config
};

export type {jwtHeader, jwtPayload }; 

export default sha512 ;

export {    
    Bson,
    MongoClient,
}
export {    
    ClientMariaDB,
}

****************************************

//--- server.ts
 
import { Application } from "./dependences.ts";

import routerQuotes from "./routes/quotes.ts";
//import routerUsers from "./routes/users.ts";


import NotFound from "./middleware/notfound.ts";
import errorHandler from "./middleware/errorhandler.ts";


const env = Deno.env.toObject()

const PORT = env.PORT || 2022;
const HOST = env.HOST || '0.0.0.0';

const app = new Application();

app.use(errorHandler);


//--- Quotes
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

*****************************************************

//-- middleware/notfound.ts
import { Context, Status } from "../dependences.ts";


const NotFound = async (ctx: Context) => {
  ctx.response.status = Status.NotFound;
  ctx.response.body = { 
      success: false,
      message: "Resource not found !!", 
      data: []
    };
};

export default NotFound;
____________________________________
//--- middleware/auth.ts
import { Context, jwtVerify, Status } from "../dependences.ts";

import { key } from "./jwt/jwt.ts";

const authMiddleware = async (ctx: Context, next: any) => {
    const headers: Headers = ctx.request.headers;
    const authorization = headers.get("Authorization");

    if (authorization){
        const jwt = authorization.split(" ")[1];
        if (jwt){
            if (await jwtVerify(jwt, key)) {
                await next();
            } else {
                ctx.response.status = Status.Unauthorized;
                ctx.response.body = { 
                    success: false,
                    message: "Invalid jwt token",
                    data: [],
                 };
            }   
        } else {
            ctx.response.status = Status.Unauthorized;
            ctx.response.body = { 
                success:  false, 
                message: "JWT is necessary",
                data: []
            };
        }      
    } else {
        ctx.response.status = Status.Unauthorized;
        ctx.response.body = { 
            success: false, 
            message: "Header Authorization not present",
            data: [], 
        };
    }    
};

export { authMiddleware };
__________________________________________________________________
//--- middleware/errorhandler.ts
import { Context, Status } from "../dependences.ts";

const errorHandler = async (ctx: Context, next: any) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { 
        success: false,
        message: err.message, 
        data: [], 
    };
  }
};

export default errorHandler;

_______________________________________
//--- middleware/jwt/jwt.ts
import { 
    getNumericDate 
} from "../../dependences.ts";

import type {
    jwtPayload, 
    jwtHeader
} from "../../dependences.ts"; 

const header:jwtHeader = { alg: 'HS512', typ: 'JWT' }

const  payload = (name:string) => {

    const payloader:jwtPayload = {
        //--- Identifica el objeto o usuario en nombre del cual fue emitido el JWT
        sub: 'cardoso.developer',
        //--- Identifica la audiencia o receptores para lo que el JWT fue emitido, normalmente el/los servidor/es de recursos (e.g. la API protegida)
        aud: 'api-quotes',
        //--- expiración del token (24 hour from now) 
        exp: getNumericDate(60 * 60 * 24),
        //--- Identifica la marca temporal en qué el JWT fue emitido 
        iat: getNumericDate(new Date()),
        //--- a partir de cuando es válido
        nbf: getNumericDate(new Date()),
        //--- Identificador único del token incluso entre diferente proveedores de servicio
        jit: '1694503654949484338',
        //--- user
        name: name,

    };
    return payloader
};

const key=  await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"],
  );
  
{};
export { header, payload, key}

//--- utils/sha512.ts
export default async function sha512(message) {
    const msgUint8 = new TextEncoder().encode(message); 
    const hashBuffer = await crypto.subtle.digest('SHA-512',msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
    return hashHex;
}

//--- routes/quotes.ts
import { Router } from "../dependences.ts";
import {
    getQuotes,
    getQuote, 
    addQuote,
    updateQuote,
    deleteQuote,
} from "../controllers/QuoteController.ts";

import { authMiddleware } from "../middleware/auth.ts";

const router = new Router();

router.get("/api/v1/quotes", authMiddleware,  getQuotes)
  .get("/api/v1/quotes/:id",  getQuote)
 //.get("/api/v1/quotes/:id", getQuote )
  .post("/api/v1/quotes",  addQuote)
  //.put("/api/v1/quotes/:id", authMiddleware, updateQuote)
  .put("/api/v1/quotes/:id", updateQuote)
  //.delete("/api/v1/quotes/:id",authMiddleware, deleteQuote);
  .delete("/api/v1/quotes/:id", deleteQuote);

  
export default router;

deno run --allow-net --allow-read --allow-env server.ts



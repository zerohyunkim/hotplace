import express from "express";
import morgan from "morgan";
import testRouter from "./test/test.router";
import dotenv from "dotenv";
import { userContract, userRouter } from "./user/user_router";
import { dbScheduler } from "./scheduler/scheduler";
import db from "./db/models";
import schedule from "node-schedule";
import { createExpressEndpoints, initServer } from "@ts-rest/express";
import { contract } from "./contracts";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";
import { jwtMiddleware } from "./user/authorization/jwtMiddleware";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("dev"));

app.use("/api", testRouter);
app.use("/openapi", swaggerUi.serve, swaggerUi.setup(openApiDocument));

db.sequelize
  .sync({
    force: true, //임시
  })
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.error(err);
  });

const s = initServer();
const router = s.router(contract, {
  createPost: async ({ body: { body, title } }) => ({
    status: 201,
    body: { id: "1", body: body, title: title },
  }),
  getPost: async ({ params: { id } }) => ({
    status: 200,
    body: { id, body: "test body", title: "test" },
  }),
});
//example
createExpressEndpoints(contract, router, app);

//users{가입, 로그인}
createExpressEndpoints(userContract.signup, userRouter.signup, app);
//users{유저정보, 유저정보 업데이트}
createExpressEndpoints(userContract.userInfo, userRouter.userInfo, app, {
  globalMiddleware: [jwtMiddleware],
});

app.listen(3000, () => {
  console.log("Server On");
  schedule.scheduleJob("0 * * * * *", function () {
    dbScheduler();
  });
});

/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)

*/

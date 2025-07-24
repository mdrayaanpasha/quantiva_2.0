import express from "express";
import { UserController } from "../controller/user.controller";

const UserRouter = express.Router();

UserRouter.post("/register", UserController.register);
UserRouter.post("/login", UserController.login);

export default UserRouter;

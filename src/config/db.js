
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Db connection successfull");

    } catch (error) {
        console.log(error);
    }
}

export default connectDb;
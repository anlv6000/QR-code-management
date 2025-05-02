import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("🔗 Đã kết nối MongoDB Atlas!"))
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

const VisitSchema = new mongoose.Schema({ ip: String, time: Date });
const Visit = mongoose.model("Visit", VisitSchema);

app.get("/track", async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await Visit.create({ ip, time: new Date() });
    res.redirect("https://www.facebook.com/CTechLab");
});

app.get("/", async (req, res) => {
    const count = await Visit.countDocuments();
    res.render("index", { count });
});

app.get("/list", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.date) {
        const date = new Date(req.query.date);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        filter.time = { $gte: date, $lt: nextDay };
    }

    const visits = await Visit.find(filter).sort({ time: -1 }).skip(skip).limit(limit);
    res.render("list", { visits, page });
});

app.listen(3000, () => console.log("🚀 Server chạy trên cổng 3000"));
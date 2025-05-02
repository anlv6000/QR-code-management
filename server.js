import express from "express";
import mongoose from "mongoose";

const app = express();
app.use(express.json());
app.set("view engine", "ejs"); // Sử dụng EJS để hiển thị web
app.use(express.static("public")); // Tải CSS

mongoose.connect("mongodb://localhost:27017/tracking")
    .then(() => console.log("🔗 Đã kết nối MongoDB!"))
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// Mô hình dữ liệu
const VisitSchema = new mongoose.Schema({ ip: String, time: Date });
const Visit = mongoose.model("Visit", VisitSchema);

// API `/track` → Ghi nhận lượt truy cập
app.get("/track", async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await Visit.create({ ip, time: new Date() });

    res.redirect("https://www.facebook.com/CTechLab"); // Chuyển hướng Facebook
});

// API hiển thị tổng số lượt truy cập
app.get("/", async (req, res) => {
    const count = await Visit.countDocuments();
    res.render("index", { count });
});

// API hiển thị danh sách đầy đủ với phân trang & lọc theo ngày
app.get("/list", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Lọc theo ngày (nếu có)
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
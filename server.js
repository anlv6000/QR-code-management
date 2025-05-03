import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Nạp biến môi trường từ file .env nếu có (Railway cũng sẽ cung cấp biến môi trường qua dashboard)
dotenv.config();

const app = express();
app.use(express.json());
app.set("view engine", "ejs"); // Sử dụng EJS để hiển thị web
app.use(express.static("public")); // Tải CSS

// Kiểm tra biến MONGO_URI để đảm bảo chính xác
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:mjhlAOngZefJBhaIGEXVQATrGXGLnFTU@interchange.proxy.rlwy.net:18866/tracking_corrected?retryWrites=true&w=majority";
console.log("🔍 MONGO_URI:", MONGO_URI);

// Kết nối MongoDB với try-catch để xử lý lỗi tốt hơn
(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("🔗 Đã kết nối MongoDB!");
    } catch (err) {
        console.error("❌ Lỗi kết nối MongoDB:", err);
        process.exit(1); // Dừng server nếu lỗi kết nối
    }
})();

// Mô hình dữ liệu MongoDB
const VisitSchema = new mongoose.Schema({ ip: String, time: Date });
const Visit = mongoose.model("Visit", VisitSchema);

// API `/track` → Ghi nhận lượt truy cập với xử lý lỗi
app.get("/track", async (req, res) => {
    try {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        await Visit.create({ ip, time: new Date() });
        res.redirect("https://www.facebook.com/CTechLab"); // Chuyển hướng Facebook
    } catch (err) {
        console.error("❌ Lỗi khi ghi dữ liệu:", err);
        res.status(500).send("Lỗi ghi dữ liệu vào MongoDB");
    }
});

// API hiển thị tổng số lượt truy cập
app.get("/", async (req, res) => {
    try {
        const count = await Visit.countDocuments();
        res.render("index", { count });
    } catch (err) {
        console.error("❌ Lỗi khi lấy tổng lượt truy cập:", err);
        res.status(500).send("Lỗi lấy dữ liệu từ MongoDB");
    }
});

// API hiển thị danh sách đầy đủ với phân trang & lọc theo ngày, kiểm tra định dạng ngày hợp lệ
app.get("/list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const filter = {};

        // Kiểm tra ngày có đúng định dạng không
        if (req.query.date) {
            const date = new Date(req.query.date);
            if (isNaN(date.getTime())) {
                return res.status(400).send("Ngày không hợp lệ!");
            }
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            filter.time = { $gte: date, $lt: nextDay };
        }

        const visits = await Visit.find(filter).sort({ time: -1 }).skip(skip).limit(limit);
        res.render("list", { visits, page });
    } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách lượt truy cập:", err);
        res.status(500).send("Lỗi lấy dữ liệu từ MongoDB");
    }
});


// Khởi động server
app.listen(3000, () => console.log("🚀 Server chạy trên cổng 3000"));

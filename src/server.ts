// 1: import all the dependencies
import express from 'express'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser"
import cors from "cors"
import authRoutes from './routes/authRoutes'
import { AppDataSource } from './config/data-source'
import jobRoutes from './routes/jobRoutes'
import usersRoutes from './routes/usersRoute'
import ApplicationsRoutes from './routes/ApplicationsRoutes'
import aiRoutes from './routes/aiRoutes'
import interviewRoutes from './routes/interviewRoutes'



dotenv.config()
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET, PUT,DELETE, POST",
  credentials: true //allows cookies and auth headers
}))

app.use("/api/v1/auth", authRoutes)

app.use('/api/v1/jobs',jobRoutes)

app.use('/api/v1/users', usersRoutes)

app.use('/api/v1/applications', ApplicationsRoutes)

app.use('/api/v1/AI', aiRoutes)

app.use('/api/v1/interviews',interviewRoutes)



AppDataSource.initialize()
  .then(async () => {
    console.log("🚀 Database connected successfully")
  })
  .catch((error) => console.log("Database connection error:", error));


app.get('/', (req, res) => {
  res.send('Backend running 🚀')
})


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀🚀 server is running on port - ${PORT}`)
})

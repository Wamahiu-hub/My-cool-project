import express from 'express'
import { protect } from '../middlewares/auth/protect'
import { deleteJob, getAllJobs, getMyJobs, postJob, updateJob } from '../controllers/jobController'


const router = express.Router()

router.post("/postJob",protect,postJob )
router.get("/getallJobs",protect,getAllJobs )
router.get("/getMyJobs",protect,getMyJobs )
router.patch("/updateJob/:jobId",protect,updateJob )
router.delete("/deleteJob/:jobId",protect,deleteJob )




export default router
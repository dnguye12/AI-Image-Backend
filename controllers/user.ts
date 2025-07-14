import { Request, Response, Router } from "express"
import User from "../models/user"

const userRouter = Router()

userRouter.route("/:id").get(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) {
        res.status(400).json('Missing input ID')
        return
    }

    try {
        let user = await User.findById(id)
        if (user) {
            res.status(200).json(user)
            return
        } else {
            res.status(204).json({ error: 'Profile not found' });
            return
        }
    } catch (error: unknown) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

userRouter.route("/").post(async (req: Request, res: Response) => {
    const { id, fullName, imageUrl, username } = req.body

    const newUser = new User({
        _id: id,
        fullName,
        imageUrl,
        username
    })

    try {
        const savedUser = await newUser.save()
        res.status(201).json(savedUser)
    } catch (error: unknown) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

module.exports = userRouter
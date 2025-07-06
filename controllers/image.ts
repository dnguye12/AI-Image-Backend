import { Request, Response, Router } from "express"
import Image from "../models/image"

const imageRouter = Router()

imageRouter.route("/:id").get(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) {
        res.status(400).json('Missing input ID')
        return
    }

    try {
        let image = await Image.findById(id)

        if (image) {
            res.status(200).json(image)
        } else {
            res.status(204).json({ error: 'Image not found' });
        }
    } catch (error: unknown) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})


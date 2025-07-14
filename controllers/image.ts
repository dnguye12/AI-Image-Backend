import { Request, Response, Router } from "express"
import Image from "../models/image"
import User from "../models/user"

const imageRouter = Router()

imageRouter.route("/recent").get(async (req: Request, res: Response) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 }).limit(30).select("-buffer")

        res.status(200).json(images)
    } catch (error) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/popular").get(async (req: Request, res: Response) => {
    try {
        const helper = await Image.aggregate([
            {
                $addFields: {
                    popularity: {
                        $subtract: [
                            { $size: '$likedBy' },
                            { $size: '$dislikedBy' }
                        ]
                    }
                }
            },
            { $sort: { popularity: -1 } },
            { $limit: 30 },
            {
                $project: {
                    buffer: 0,
                    _v: 0
                }
            }
        ])

        const response = helper.map(img => {
            const { _id, ...rest } = img;
            return {
                id: _id.toString(),
                ...rest
            };
        });

        res.status(200).json(response)
    } catch (error) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/random").get(async (req: Request, res: Response) => {
    try {
        const helper = await Image.aggregate([
            { $sample: { size: 30 } },
            {
                $project: {
                    buffer: 0,
                    _v: 0
                }
            }
        ])

        const response = helper.map(img => {
            const { _id, ...rest } = img;
            return {
                id: _id.toString(),
                ...rest
            };
        });

        res.status(200).json(response)
    } catch (error) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/search").post(async (req: Request, res: Response) => {
    const { prompt } = req.body

    try {
        const helper = (await Image.find({ $text: { $search: prompt } })) || []
        res.status(200).json(helper)
    } catch (error: unknown) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/:id/info").get(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) {
        res.status(400).json('Missing input ID')
        return
    }

    try {
        let image = await Image.findById(id).select("-buffer")

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

imageRouter.route("/:id/image").get(async (req: Request, res: Response) => {
    const { id } = req.params


    if (!id) {
        res.status(400).json('Missing input ID')
        return
    }

    try {
        let image = await Image.findById(id).select("buffer")

        if (image) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.status(200).send(image.buffer)
        } else {
            res.status(204).json({ error: 'Image not found' });
        }
    } catch (error: unknown) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/").post(async (req: Request, res: Response) => {
    const { prompt, model, width, height, seed, createdBy, imageLink } = req.body

    try {
        const helper = await fetch(imageLink)

        if (!helper.ok) {
            res.status(502).send("Failed to fetch image URL")
        }

        const arrayBuffer = await helper.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const newImage = new Image({
            prompt,
            model,
            width,
            height,
            seed,
            createdBy,
            buffer
        })
        const savedImage = await newImage.save()

        const user = await User.findById(createdBy)

        user?.images.push(savedImage._id)

        await user?.save()

        res.status(201).json(savedImage)
    } catch (error) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/:id/like").patch(async (req: Request, res: Response) => {
    const imageId = req.params.id
    const { userId } = req.body

    if (!userId) {
        res.status(400).json({ error: "Missing userId in request body" })
        return
    }

    try {
        const image = await Image.findById(imageId)
        const user = await User.findById(userId)

        if (image && user) {
            const likedIndex = image.likedBy.indexOf(userId)
            if (likedIndex !== -1) {
                image.likedBy.splice(likedIndex, 1)

                const likedIndexUser = user.likedImages.indexOf(image._id)

                if (likedIndexUser !== -1) {
                    user.likedImages.splice(likedIndexUser, 1)
                }

                await user.save()
                const updatedImage = await image.save()

                res.status(200).json(updatedImage)
                return
            } else {
                image.likedBy.push(userId)
                user.likedImages.push(image._id)

                const dislikedIndex = image.dislikedBy.indexOf(userId)

                if (dislikedIndex !== -1) {
                    image.dislikedBy.splice(dislikedIndex, 1)

                    const dislikedIndexUser = user.dislikedImages.indexOf(image._id)
                    if (dislikedIndexUser !== -1) {
                        user.dislikedImages.splice(dislikedIndexUser, 1)
                    }
                }

                const updatedImage = await image.save()
                await user.save()
                res.status(200).json(updatedImage)
                return
            }
        } else {
            res.status(204).json({ error: 'Image/user not found' });
            return
        }
    } catch (error) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

imageRouter.route("/:id/dislike").patch(async (req: Request, res: Response) => {
    const imageId = req.params.id
    const { userId } = req.body

    if (!userId) {
        res.status(400).json({ error: "Missing userId in request body" })
        return
    }

    try {
        const image = await Image.findById(imageId)
        const user = await User.findById(userId)

        if (image && user) {
            const dislikedIndex = image.dislikedBy.indexOf(userId)
            if (dislikedIndex !== -1) {
                image.dislikedBy.splice(dislikedIndex, 1)

                const dislikedIndexUser = user.dislikedImages.indexOf(image._id)

                if (dislikedIndexUser !== -1) {
                    user.dislikedImages.splice(dislikedIndexUser, 1)
                }

                await user.save()
                const updatedImage = await image.save()

                res.status(200).json(updatedImage)
                return
            } else {
                image.dislikedBy.push(userId)
                user.dislikedImages.push(image._id)

                const likedIndex = image.likedBy.indexOf(userId)

                if (likedIndex !== -1) {
                    image.likedBy.splice(likedIndex, 1)

                    const likedIndexUser = user.likedImages.indexOf(image._id)
                    if (likedIndexUser !== -1) {
                        user.likedImages.splice(likedIndexUser, 1)
                    }
                }

                const updatedImage = await image.save()
                await user.save()
                res.status(200).json(updatedImage)
                return
            }
        } else {
            res.status(204).json({ error: 'Image/user not found' });
            return
        }
    } catch (error) {
        console.log(error)
        res.status(500).json('Backend error')
    }
})

module.exports = imageRouter
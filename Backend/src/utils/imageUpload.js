import crypto from "crypto"
import path from "path"
import { mkdir, writeFile } from "fs/promises"

const allowedMimeTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"]
])

const maxImageBytes = 4 * 1024 * 1024

export const saveDataImage = async (dataUrl, folder = "blogs") => {
    if (!dataUrl) {
        return null
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/)

    if (!match) {
        throw new Error("Invalid image upload")
    }

    const [, mimeType, encoded] = match
    const extension = allowedMimeTypes.get(mimeType)

    if (!extension) {
        throw new Error("Unsupported image type")
    }

    const buffer = Buffer.from(encoded, "base64")

    if (buffer.length > maxImageBytes) {
        throw new Error("Cover image must be 4MB or smaller")
    }

    const uploadDirectory = path.join(process.cwd(), "uploads", folder)
    const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`
    const filePath = path.join(uploadDirectory, fileName)

    await mkdir(uploadDirectory, { recursive: true })
    await writeFile(filePath, buffer)

    return `/uploads/${folder}/${fileName}`
}

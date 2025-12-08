import TextToImage from "@/components/shared/text-to-image"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Image Generator",
    description: "Generate images with AI",
}

export default function ImageGeneratorPage() {
    return <TextToImage />
}
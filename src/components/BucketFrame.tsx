import { useState } from "react";
import deleteIcon from "../assets/delete.png"

interface BucketFrameProps {
    bucketName: string;
    onDelete: (name: string) => void;
    onClick: (name: string) => void;
}

export function BucketFrame(
    { bucketName, onDelete, onClick}: BucketFrameProps
) {
    const [isHover, setIsHover] = useState(false);

    const handleDelete = () => {
        onDelete(bucketName);
    };

    const handleClick = () => {
        onClick(bucketName)
    };

    return (
        <div className="w-full"
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
        >
            <div className="bg-amber-300 w-full h-full rounded-lg text-black relative" onClick={handleClick}>
                {isHover && (
                    <img
                        src={deleteIcon}
                        alt={`${bucketName} image`}
                        onClick={
                            (event) => {
                                event.stopPropagation();
                                handleDelete();
                            }
                        }
                        className="w-1/12 h-auto rounded-t-lg absolute top-0 right-0 m-2"
                    />
                )}
                <p className="p-3 font-bold flex flex-row justify-center">{bucketName}</p>
            </div>
        </div>
    );
}
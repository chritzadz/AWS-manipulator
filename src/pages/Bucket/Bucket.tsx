import { useState, type Key } from "react";
import { useLocation } from "react-router-dom";
import uploadIcon from "../../assets/upload.png";

function Bucket(){
    const { state } = useLocation();
    const [ bucketName, setBucketName ] = useState(state?.bucketName);

    return (
    <div className="bg-amber-200 h-screen w-screen flex flex-col justify-center items-center pt-20 pb-10">
        <div className="text-4xl mb-10 font-bold">{bucketName}</div>
        <div className="flex flex-row w-full h-full justify-center gap-10 pr-20 pl-20">
            <div className="mx-3 rounded-3xl bg-amber-100 w-1/2 h-full flex-col flex p-10">
                <div className="rounded-3xl bg-amber-400 justify-center flex flex-row items-center p-5 gap-5">
                    <img className="w-1/25" src={uploadIcon}></img>
                    <p className="text-2xl font-bold">Upload your .glb here!</p>
                </div>
                <p className="text-xs font-bold">Status</p>
            </div>
            <div className="mx-3 rounded-3xl bg-amber-100 w-1/2 h-full">
                {/* Content for the second div */}
            </div>
        </div>
    </div>
);
}

export default Bucket
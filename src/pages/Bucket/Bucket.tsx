import { useState, type Key } from "react";
import { useLocation } from "react-router-dom";
import { BucketFrame } from "../../components/BucketFrame";


function Bucket(){
    const { state } = useLocation();
    const [ bucketName, setBucketName ] = useState(state?.bucketName);

    return (
        <>
            {bucketName}
        </>
    )
}

export default Bucket
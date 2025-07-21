import { useState, type Key } from "react";
import { useLocation } from "react-router-dom";

function Home() {
    const { state } = useLocation();
    const [ bucketList, setBucketList ] = useState(state?.bucketList);

    const [bucketName, setBucketName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [warningEmpty, setWarningEmpty] = useState(false);

    const handleOpenAddNewBucketWindow = () => {
        setIsModalOpen(true);
    };

    const handleCloseAddNewBucketWindow = () => {
        setIsModalOpen(false);
        setWarningEmpty(false)
    };

    const handleAddBucket = async () => {
        if (bucketName == "" || bucketName == ''){
            setWarningEmpty(true)
        }
        else{
            const token = localStorage.getItem('authToken');
            console.log(token)

            console.log("fetching token exist")
            const response = await fetch('/.netlify/functions/create_bucket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    bucketParams: {
                        Bucket: bucketName
                    }
                })
            });

            const data = await response.json()

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            } else {
                const tempArray = data.buckets.map((element: { Name: any }) => {
                    return {
                        name: element.Name
                    };
                })

                setBucketList(tempArray)
            }
            setIsModalOpen(false)
        }
    }

    return(
        <div className="bg-amber-200 h-screen w-screen flex flex-row gap-20 pt-20 pb-10 justify-center">
            <div className="rounded-3xl bg-amber-100 w-1/2">
                <div>
                    <p className="p-5 text-2xl font-bold justify-center flex">Buckets</p>
                </div>
                <div className="flex flex-wrap pl-3">
                    {bucketList.map((bucketObj: {name: string}, index: Key | null | undefined) => (
                        <div className="w-1/4 pr-3 pb-3">
                            <div key={index} className="bg-amber-300 w-full h-full rounded-lg text-black">
                                <p className="p-3 font-bold flex flex-row justify-center">{bucketObj.name}</p>
                            </div>
                        </div>
                    ))}

                    <div className="w-1/4 pr-3 pb-3">
                        <div
                            onClick={handleOpenAddNewBucketWindow}
                            className="bg-amber-400 w-full h-full rounded-lg text-black flex items-center justify-center cursor-pointer"
                        >
                            <p className="p-3 font-bold">Add Bucket</p>
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-50/75 flex justify-center items-center">
                        <div className="bg-white rounded-lg p-5 w-1/3">
                            <h2 className="text-lg font-bold mb-4">Add New Bucket</h2>
                            <input
                                type="text"
                                value = {bucketName}
                                onChange={(e) => setBucketName(e.target.value)}
                                placeholder="Bucket Name"
                                className="border rounded w-full p-2 mb-1"
                            />

                            {warningEmpty && (
                                <p className="text-red-600 text-xs mb-3 font-bold">Bucket name must not be empty!</p>
                            )}
                        
                            <div className="flex justify-between">
                                <button onClick={handleCloseAddNewBucketWindow} className="text-2xs bg-amber-800 text-white px-4 py-2 rounded font-bold">
                                    Cancel
                                </button>
                                <button onClick={handleAddBucket} className="bg-amber-800 text-white text-2xs px-4 py-2 rounded font-bold">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Home
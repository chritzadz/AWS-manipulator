import { useEffect, useState, type Key } from "react";
import { useNavigate } from "react-router-dom";
import { BucketFrame } from "../../components/BucketFrame";

function Home() {
    const [ bucketList, setBucketList ] = useState([]);
    useEffect(() => {
        const fetchBucketList = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await fetch('/.netlify/functions/get_bucket', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error();
                }

                const data = await response.json();
                setBucketList(data?.buckets || []);
            } catch (error) {
                console.error('Error fetching bucket list:', error);
            }
        };

        fetchBucketList();
    }, []);
    

    const navigate = useNavigate();

    const [bucketName, setBucketName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
    const [bucketNameDeleted, setbucketNameDeleted] = useState('');
    const [warningEmpty, setWarningEmpty] = useState(false);
    const [loadingAdd, setLoadingAdd] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    

    const handleOpenAddNewBucketWindow = () => {
        setIsModalOpen(true);
    };

    const handleCloseAddNewBucketWindow = () => {
        setIsModalOpen(false)
        setWarningEmpty(false)
    };

    const handleOpenDeleteBucketWindow = (name: string) => {
        setIsModalDeleteOpen(true);
        setbucketNameDeleted(name);
    };

    const handleCloseDeleteBucketWindow = () => {
        setIsModalDeleteOpen(false)
    };

    const handleAddBucket = async () => {
        setLoadingAdd(true);
        if (bucketName == "" || bucketName == ''){
            setWarningEmpty(true)
        }
        else{
            const token = localStorage.getItem('authToken');
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
            setLoadingAdd(false);
        }
    }

    const handleDeleteBucket = async () => {
        setLoadingDelete(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/.netlify/functions/delete_bucket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                bucketParams: {
                    Bucket: bucketNameDeleted
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
        setbucketNameDeleted('')
        setIsModalDeleteOpen(false)
        setLoadingDelete(false);
    }

    const handleBucketClick = (name: string) => {
        navigateBucket(name)
    }

    const navigateBucket = (name: string) => {
        navigate('/bucket', {
            state : {
                bucketName : name
            }
        })
    }
    
    

    return(
        <div className="bg-amber-200 h-screen w-screen flex flex-row gap-20 pt-20 pb-10 justify-center">
            <div className="rounded-3xl bg-amber-100 w-1/2 flex-col flex">
                <div>
                    <p className="p-5 text-2xl font-bold justify-center flex">Buckets</p>
                </div>
                <div className="flex flex-wrap pl-3">
                    {bucketList.map((bucketObj: {name: string}, index: Key | null | undefined) => (
                        <div key={index} className="w-1/4 pr-3 pb-3">
                            <BucketFrame bucketName={bucketObj.name} onDelete={handleOpenDeleteBucketWindow}  onClick={handleBucketClick}></BucketFrame>
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
                        
                            <div className="flex justify-between mt-2">
                                <button onClick={handleCloseAddNewBucketWindow} className="text-2xs bg-amber-800 text-white px-4 py-2 rounded font-bold">
                                    Cancel
                                </button>
                                {loadingAdd ?
                                    (
                                        <div role="status">
                                        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-amber-950" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                        </svg>
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    )
                                    : ( <button onClick={handleAddBucket} className="bg-amber-800 text-white text-2xs px-4 py-2 rounded font-bold">
                                            Add
                                        </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isModalDeleteOpen && (
                    <div className="fixed inset-0 bg-gray-50/75 flex justify-center items-center">
                        <div className="bg-white rounded-lg p-5 w-1/3">
                            <h2 className="text-lg font-bold mb-2">Delete Bucket</h2>
                            <p className="mb-4"> Are you sure you want to delete <span className="font-bold">{bucketNameDeleted}</span> bucket?</p>
                            <div className="flex justify-between">
                                <button onClick={handleCloseDeleteBucketWindow} className="text-2xs bg-amber-800 text-white px-4 py-2 rounded font-bold">
                                    Cancel
                                </button>
                                {loadingDelete ?
                                    (
                                        <div role="status">
                                        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-amber-950" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                        </svg>
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    )
                                    : ( <button onClick={handleDeleteBucket} className="bg-amber-800 text-white text-2xs px-4 py-2 rounded font-bold">
                                            Delete
                                        </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Home
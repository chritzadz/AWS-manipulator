import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { BucketFrame } from '../../components/BucketFrame';

function SignIn() {
    const [secretKey, setSecretKey] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        setLoading(true);
        e.preventDefault();

        try {
            const response = await fetch('/.netlify/functions/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    accessKey,
                    secretKey,
                    region
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            const data = await response.json();
            localStorage.setItem('authToken', data.token);

            //process data
            const tempArray = data.buckets.map((element: { Name: any }) => {
                return {
                    name: element.Name
                    };
            });

            navigate('/home', {
                state : {
                    bucketList: tempArray
                }
            })
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return(
        <>
            <div className="bg-amber-100 h-screen w-screen flex flex-col justify-center">
                <h2 className="text-center text-5xl font-bold pb-10">Sign In</h2>
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <div className="mb-4">
                        <label htmlFor="secretKey" className="block text-sm font-medium">Secret Key:</label>
                        <div className= "shadow-amber-800">
                            <input
                                type="password"
                                id="secretKey"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="accessKey" className="block text-sm font-medium">Access Key:</label>
                        <input
                            type="password"
                            id="accessKey"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="region" className="block text-sm font-medium">Region:</label>
                        <input
                            type="text"
                            id="region"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>
                    {loading ?
                    (
                        <div role="status">
                        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-amber-950" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                    )
                    : ( <button type="submit" className="bg-amber-800 text-white p-2 rounded" disabled={loading}>
                            Submit
                        </button>
                    )}
                </form>
            </div>
        </>
    )
}

export default SignIn
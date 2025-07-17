import React, { useState } from 'react';

function SignIn() {
    const [secretKey, setSecretKey] = useState('');
    const [accessKey, setAccessKey] = useState('');

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        console.log('Secret Key:', secretKey);
        console.log('Access Key:', accessKey);
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
                    <button type="submit" className="bg-amber-800 text-white p-2 rounded">
                        Submit
                    </button>
                </form>
            </div>
        </>
    )
}

export default SignIn
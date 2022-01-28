import Link from 'next/link';

export default function Home() {
    return (
        <>
            <h1>My page</h1>
            <Link href="/login">Login</Link>
        </>
    );
}

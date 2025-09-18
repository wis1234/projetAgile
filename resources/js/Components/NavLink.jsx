import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-3 py-2 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none rounded-md ' +
                (active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 focus:border-blue-700 hover:bg-blue-100'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:bg-gray-100') +
                ' ' + className
            }
        >
            {children}
        </Link>
    );
}

export default function ApplicationLogo(props) {
    return (
        <span
            {...props}
            className={
                'font-extrabold text-3xl md:text-4xl tracking-tight text-blue-700 select-none font-sans ' +
                (props.className || '')
            }
            style={{ letterSpacing: '0.05em', ...props.style }}
        >
            Pro<span className="text-orange-500">J</span>A
        </span>
    );
}

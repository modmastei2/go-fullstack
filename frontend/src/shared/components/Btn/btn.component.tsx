import Button from "@mui/material/Button";

interface BtnProps {
    style?: 'text' | 'outlined' | 'contained';
    className?: string;
    text?: string;
}

export default function Btn({ style = 'contained', className, text }: BtnProps) {
    return (
        <Button variant={style} className={`text-red-400 ${className || ''}`}>
            {text || "Default Button"}
        </Button>
    );
}
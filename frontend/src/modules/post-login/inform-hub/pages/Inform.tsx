import Calendar from "../components/Calendar";

export default function Inform() {
    return (
        <>
            <div className="grid grid-cols-12 gap-2">
                {/* display with 2 block grid l = 9 size, r = 3 size */}
                <div className="col-span-9">
                    <Calendar />
                </div>
                <div className="col-span-3">
                    Inform Hub Sidebar
                </div>
                    
            </div>
        </>
    )
}
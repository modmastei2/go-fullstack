import { useSearchParams } from "react-router-dom";

export default function FeatureView() {
    const [params] = useSearchParams();
    const featureId = params.get("featureId");

    return <div>Feature View Component : {featureId}</div>;
}
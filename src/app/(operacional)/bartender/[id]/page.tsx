import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BartenderComandaPage({ params }: Props) {
  const { id } = await params;
  redirect(`/garcom/${id}`);
}

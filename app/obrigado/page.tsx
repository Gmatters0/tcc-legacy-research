export default function ObrigadoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Obrigado pela sua participação!</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sua contribuição para esta pesquisa foi registrada com sucesso. Você já pode fechar esta
          janela.
        </p>
      </div>
    </div>
  );
}

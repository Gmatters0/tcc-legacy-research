"use client";

// Modal de confirmação genérico para ações destrutivas do painel admin
// (exclusão de sessão/usuário, individual ou em massa) — evita que um clique
// errado apague dado de pesquisa sem chance de voltar atrás.
interface Props {
  titulo: string;
  descricao: string;
  confirmando: boolean;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmModal({
  titulo,
  descricao,
  confirmando,
  textoConfirmar = "Excluir",
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-titulo"
    >
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h3 id="confirm-modal-titulo" className="text-base font-semibold text-zinc-900">
          {titulo}
        </h3>
        <p className="mt-2 text-sm text-zinc-600">{descricao}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={confirmando}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={confirmando}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirmando ? "Excluindo…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

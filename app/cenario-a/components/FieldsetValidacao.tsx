"use client";

type Campo = "numero" | "fornecedor" | "dataEmissao" | "valorTotal";

interface Props {
  numero: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: string;
  onChange: (campo: Campo, valor: string) => void;
}

export function FieldsetValidacao({
  numero,
  fornecedor,
  dataEmissao,
  valorTotal,
  onChange,
}: Props) {
  return (
    <fieldset className="border border-[#727780] p-2">
      <legend className="px-1 text-[11px] font-bold text-black">1. NF Validation</legend>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 py-1">
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Número NF <span className="text-[#dc2626]">*</span>:
          <input
            type="text"
            value={numero}
            onChange={(e) => onChange("numero", e.target.value)}
            className="w-24 border border-[#6b7280] bg-white px-3 py-2 text-base text-[#1b1c1c] uppercase focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Fornecedor:
          <input
            type="text"
            value={fornecedor}
            onChange={(e) => onChange("fornecedor", e.target.value)}
            className="w-56 border border-[#6b7280] bg-white px-3 py-2 text-base text-[#1b1c1c] focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Data Emissão:
          <input
            type="text"
            value={dataEmissao}
            onChange={(e) => onChange("dataEmissao", e.target.value)}
            placeholder="DD.MM.AAAA"
            className="w-20 border border-[#6b7280] bg-white px-3 py-2 text-base text-[#1b1c1c] focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Valor Total:
          <input
            type="text"
            value={valorTotal}
            onChange={(e) => onChange("valorTotal", e.target.value)}
            className="w-24 border border-[#6b7280] bg-white px-3 py-2 text-right text-base text-[#1b1c1c] focus:outline-none"
          />
        </label>
      </div>
    </fieldset>
  );
}

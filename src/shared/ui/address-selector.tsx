"use client";

import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface Province {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

export interface AddressSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "upnext-focus flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all disabled:cursor-not-allowed disabled:opacity-50 text-left",
            isOpen && "border-primary ring-1 ring-primary outline-none",
          )}
        >
          <span className={cn(!selectedOption && "text-slate-400 font-normal")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <CaretDown
            size={16}
            className={cn(
              "text-slate-500 transition-transform duration-200 shrink-0 ml-2",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="z-50 flex max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] flex-col rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        align="start"
      >
        <div
          role="presentation"
          className="flex shrink-0 items-center border-b border-slate-100 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MagnifyingGlass size={16} className="mr-2 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Tìm kiếm"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-left transition-colors outline-none select-none",
                    isSelected
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={16} className="ml-2 shrink-0 text-emerald-600" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-xs font-semibold text-slate-400">
              Không tìm thấy kết quả
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const parseAddress = (flatAddress: string) => {
  if (!flatAddress) return { street: "", ward: "", province: "" };
  const parts = flatAddress.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const province = parts[parts.length - 1] ?? "";
    const ward = parts[parts.length - 2] ?? "";
    const street = parts.slice(0, parts.length - 2).join(", ");
    return { street, ward, province };
  }
  return { street: flatAddress, ward: "", province: "" };
};

export function AddressSelector({ value, onChange }: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedWardCode, setSelectedWardCode] = useState<string>("");
  const [street, setStreet] = useState<string>("");

  const lastProcessedValueRef = useRef<string | null>(null);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/v2/p/");
        if (res.ok) {
          const data = (await res.json()) as Province[];
          setProvinces(data);
        }
      } catch (err) {
        console.error("Failed to fetch provinces on mount", err);
      }
    };
    void fetchProvinces();
  }, []);

  // Sync state with incoming value
  useEffect(() => {
    if (provinces.length === 0) return;
    if (value === lastProcessedValueRef.current) return;
    lastProcessedValueRef.current = value;

    const syncAddress = async () => {
      const parsed = parseAddress(value);
      setStreet(parsed.street);

      const matchedProvince = provinces.find(
        (p) => p.name.toLowerCase() === parsed.province.toLowerCase(),
      );

      if (matchedProvince) {
        const provCodeStr = String(matchedProvince.code);
        setSelectedProvinceCode(provCodeStr);

        try {
          const wRes = await fetch(`https://provinces.open-api.vn/api/v2/p/${provCodeStr}?depth=2`);
          if (wRes.ok) {
            const wData = await wRes.json();
            const currentWards = (wData.wards as Ward[]) ?? [];
            setWards(currentWards);

            const matchedWard = currentWards.find(
              (w) => w.name.toLowerCase() === parsed.ward.toLowerCase(),
            );
            if (matchedWard) {
              setSelectedWardCode(String(matchedWard.code));
            } else {
              setSelectedWardCode("");
            }
          }
        } catch (err) {
          console.error("Failed to sync wards", err);
        }
      } else {
        setSelectedProvinceCode("");
        setWards([]);
        setSelectedWardCode("");
      }
    };

    void syncAddress();
  }, [value, provinces]);

  const updateParentAddress = (st: string, wa: string, pr: string) => {
    const parts: string[] = [];
    if (st.trim()) parts.push(st.trim());
    if (wa.trim()) parts.push(wa.trim());
    if (pr.trim()) parts.push(pr.trim());

    const flatAddr = parts.join(", ");
    lastProcessedValueRef.current = flatAddr;
    onChange(flatAddr);
  };

  const handleProvinceChange = async (provCodeStr: string) => {
    setSelectedProvinceCode(provCodeStr);
    setSelectedWardCode("");
    setWards([]);

    if (!provCodeStr) {
      updateParentAddress(street, "", "");
      return;
    }

    try {
      const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provCodeStr}?depth=2`);
      if (res.ok) {
        const data = await res.json();
        setWards((data.wards as Ward[]) ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch wards", err);
    }

    const provinceName = provinces.find((p) => String(p.code) === provCodeStr)?.name ?? "";
    updateParentAddress(street, "", provinceName);
  };

  const handleWardChange = (wardCodeStr: string) => {
    setSelectedWardCode(wardCodeStr);

    const provinceName = provinces.find((p) => String(p.code) === selectedProvinceCode)?.name ?? "";
    const wardName = wards.find((w) => String(w.code) === wardCodeStr)?.name ?? "";
    updateParentAddress(street, wardName, provinceName);
  };

  const handleStreetChange = (val: string) => {
    setStreet(val);
    const provinceName = provinces.find((p) => String(p.code) === selectedProvinceCode)?.name ?? "";
    const wardName = wards.find((w) => String(w.code) === selectedWardCode)?.name ?? "";
    updateParentAddress(val, wardName, provinceName);
  };

  const provinceOptions = provinces.map((p) => ({
    value: String(p.code),
    label: p.name,
  }));

  const wardOptions = wards.map((w) => ({
    value: String(w.code),
    label: w.name,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Province Select */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-bold text-slate-700">
            Tỉnh / Thành phố <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            value={selectedProvinceCode}
            onValueChange={handleProvinceChange}
            options={provinceOptions}
            placeholder="Chọn Tỉnh / Thành phố"
          />
        </div>

        {/* Ward Select */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-bold text-slate-700">
            Phường / Xã <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            value={selectedWardCode}
            onValueChange={handleWardChange}
            options={wardOptions}
            placeholder="Chọn Phường / Xã"
            disabled={!selectedProvinceCode}
          />
        </div>
      </div>

      {/* Street Address Input */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-bold text-slate-700">
          Số nhà, tên đường <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none"
          placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
          value={street}
          onChange={(e) => handleStreetChange(e.target.value)}
        />
      </div>
    </div>
  );
}

"use client";
import React, { useMemo, useCallback, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Selection,
  SortDescriptor,
  ChipProps,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  RadioGroup,
  Radio,
  Select,
  SelectItem,
  Spinner,
  type ButtonProps,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { SearchIcon } from "@heroui/shared-icons";

// Define types for our dynamic table props and data
type CellRenderFunction = (item: any, columnKey: string) => React.ReactNode;
type AccordionRenderFunction = (item: any) => React.ReactNode;

interface ColumnDefinition {
  key: string;
  label: string;
  allowsSorting?: boolean;
  cellRenderer?: CellRenderFunction;
}

export interface TableActionButton {
  label: string;
  onClick: () => void;
  icon?: string;
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  isDisabled?: boolean;
}

interface DynamicTableProps {
  data: any[];
  columns: ColumnDefinition[];
  allowFiltering?: boolean;
  allowSorting?: boolean;
  allowColumnVisibility?: boolean;
  allowRowSelection?: boolean;
  initialVisibleColumns?: string[];
  excludeFromSorting?: string[];
  filterableColumns?: string[];
  itemsPerPage?: number;
  maxHeight?: string;
  minHeight?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  actionButton?: TableActionButton;
  extraTopRight?: React.ReactNode;
  // Nuevas props para acordeón
  isAccordion?: boolean;
  accordionContent?: AccordionRenderFunction;
  accordionIcon?: string;
  accordionText?: string;
  // Nueva prop para controlar densidad general
  density?: "comfortable" | "compact";
  isStriped?: boolean;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
  data,
  columns,
  allowFiltering = true,
  allowSorting = true,
  allowColumnVisibility = true,
  allowRowSelection = true,
  initialVisibleColumns,
  excludeFromSorting = [],
  filterableColumns = [],
  itemsPerPage = 10,
  maxHeight = "100%", // Cambiado de "65vh" a "100%"
  minHeight = "100%", // Cambiado de "65vh" a "100%"
  isLoading = false,
  loadingLabel = "Cargando...",
  actionButton,
  extraTopRight,
  isAccordion = false,
  accordionContent,
  accordionIcon = "lucide:chevron-down",
  accordionText = "",
  density = "compact",
  isStriped = false,
}) => {
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(initialVisibleColumns));
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "", direction: "ascending" });
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  // Estado para controlar qué filas del acordeón están abiertas
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const hasSearchFilter = Boolean(filterValue);

  const isCompact = density === "compact";

  const sizeConfig = useMemo(() => {
    return {
      rowHeight: isCompact ? "h-11" : "h-14",
      cellPaddingY: isCompact ? "py-2" : "py-4",
      controlSize: (isCompact ? "sm" : "md") as "sm" | "md" | "lg",
      accordionButtonVariant: (isCompact ? "light" : "faded") as "flat" | "light" | "faded" | "solid" | "bordered" | "shadow" | "ghost",
      accordionButtonSize: (isCompact ? "sm" : "md") as "sm" | "md" | "lg",
    };
  }, [isCompact]);

  // Agregar columna de acordeón si está habilitado
  const columnsWithAccordion = useMemo(() => {
    if (isAccordion) {
      return [
        ...columns,
        {
          key: "accordion_toggle",
          label: "",
          allowsSorting: false,
        }
      ];
    }
    return columns;
  }, [columns, isAccordion]);

  const headerColumns = useMemo(() => {
    return columnsWithAccordion.filter((column) =>
      Array.from(visibleColumns).includes(column.key) || column.key === "accordion_toggle"
    );
  }, [columnsWithAccordion, visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredData = [...data];

    if (hasSearchFilter) {
      filteredData = filteredData.filter((item) =>
        filterableColumns.some(
          (columnKey) =>
            item[columnKey] &&
            item[columnKey].toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }

    if (statusFilter !== "all") {
      filteredData = filteredData.filter((item) => item.status === statusFilter);
    }

    if (roleFilter !== "all") {
      filteredData = filteredData.filter((item) => item.role === roleFilter);
    }

    return filteredData;
  }, [data, filterValue, hasSearchFilter, filterableColumns, statusFilter, roleFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: any, b: any) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // Función para toggle del acordeón
  const toggleAccordion = useCallback((itemId: string) => {
    console.log("Toggling accordion for item:", itemId);
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        console.log("Item collapsed, new state:", newSet);
      } else {
        newSet.add(itemId);
        console.log("Item expanded, new state:", newSet);
      }
      return newSet;
    });
  }, []);

  const renderCell = useCallback(
    (item: any, columnKey: string) => {
      // Manejar la columna del acordeón
      if (columnKey === "accordion_toggle" && isAccordion) {
        const isExpanded = expandedRows.has(item.id);
        console.log(`Item ${item.id} isExpanded:`, isExpanded, 'expandedRows:', expandedRows);

        return (
          <Button
            variant={sizeConfig.accordionButtonVariant}
            size={sizeConfig.accordionButtonSize}
            onPress={() => toggleAccordion(item.id)}
            endContent={<Icon icon={accordionIcon} className={`text-lg transition-transform duration-200 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'
              }`} />}
          >
            {accordionText}
          </Button>
        );
      }

      const column = columns.find((c) => c.key === columnKey);

      if (column?.cellRenderer) {
        // cellRenderer puede ignorar el segundo argumento sin problema
        return column.cellRenderer(item, columnKey);
      }

      // Fallback robusto
      const v = item?.[columnKey as keyof typeof item];

      if (v === null || v === undefined || v === "") {
        return <span className="text-default-400">—</span>;
      }

      // Formatea números para que no se vean "vacíos"
      if (typeof v === "number") {
        return <span>{v.toLocaleString()}</span>;
      }

      return <span>{String(v)}</span>;
    },
    [columns, isAccordion, expandedRows, toggleAccordion, accordionIcon, accordionText, sizeConfig]
  );

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-3">
        {/* grid 1fr | auto para que la parte derecha no empuje a la izquierda */}
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto]">
          {/* IZQUIERDA: busca + acciones, con wrap */}
          <div className="min-w-0 flex flex-wrap items-center gap-2 mx-0.5">
            {allowFiltering && (
              <Input
                isClearable
                size={sizeConfig.controlSize}
                variant="bordered"
                placeholder="Buscar por..."
                startContent={<SearchIcon />}
                value={filterValue}
                onClear={() => onSearchChange("")}
                onValueChange={onSearchChange}
                className="flex-1  max-w-50"
              />
            )}

            {allowColumnVisibility && (
              <Dropdown>
                <DropdownTrigger>
                  <Button size={sizeConfig.controlSize} endContent={<Icon icon="lucide:chevron-down" />} variant="flat">
                    Columnas
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Columnas de la tabla"
                  closeOnSelect={false}
                  selectedKeys={visibleColumns}
                  selectionMode="multiple"
                  onSelectionChange={setVisibleColumns}
                >
                  {columns.map((column) => (
                    <DropdownItem key={column.key} className="capitalize">
                      {column.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}

            {allowFiltering && (
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <Button size={sizeConfig.controlSize} endContent={<Icon icon="lucide:filter" />} variant="flat">
                    Filtro
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="p-4">
                    <RadioGroup label="Estatus" value={statusFilter} onValueChange={setStatusFilter}>
                      <Radio value="all">Todos</Radio>
                      <Radio value="active">Activo</Radio>
                      <Radio value="paused">Pausado</Radio>
                    </RadioGroup>
                    <RadioGroup label="Rol" value={roleFilter} onValueChange={setRoleFilter}>
                      <Radio value="all">Todos</Radio>
                      <Radio value="CEO">CEO</Radio>
                      <Radio value="Tech Lead">Tech Lead</Radio>
                    </RadioGroup>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {allowSorting && (
              <Dropdown>
                <DropdownTrigger>
                  <Button size={sizeConfig.controlSize} endContent={<Icon icon="lucide:arrow-up-down" />} variant="flat">
                    Ordenar
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Opciones de orden"
                  onAction={(key) => setSortDescriptor({ column: key as string, direction: "ascending" })}
                >
                  {columns
                    .filter((col) => col.allowsSorting)
                    .map((column) => (
                      <DropdownItem key={column.key} className="capitalize">
                        {column.label}
                      </DropdownItem>
                    ))}
                </DropdownMenu>
              </Dropdown>
            )}

            {allowRowSelection && (
              <div className="hidden md:flex items-center h-full">
                <span className="text-default-400 text-small">
                  | {selectedKeys === "all"
                    ? `Todos ${filteredItems.length} seleccionados`
                    : `${(selectedKeys as Set<string>).size ?? 0} seleccionados`}
                </span>
              </div>
            )}
          </div>

          {/* DERECHA: botón de acción + select, fijos y sin wrap */}
          <div className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
            {actionButton && (
              <Button
                color={actionButton.color ?? "primary"}
                variant={actionButton.variant ?? "solid"}
                size={actionButton.size ?? sizeConfig.controlSize}
                isDisabled={actionButton.isDisabled}
                startContent={actionButton.icon ? <Icon icon={actionButton.icon} /> : undefined}
                onPress={actionButton.onClick}
              >
                {actionButton.label}
              </Button>
            )}
            {extraTopRight}

            <Select
              aria-label="Filas por página"
              size={sizeConfig.controlSize}
              variant="faded"
              className={isCompact ? "w-[110px]" : "w-[120px]"}
              defaultSelectedKeys={[rowsPerPage.toString()]}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <SelectItem key="5">5</SelectItem>
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="15">15</SelectItem>
            </Select>
          </div>
        </div>
      </div>
    );
  }, [
    allowFiltering,
    allowColumnVisibility,
    allowRowSelection,
    allowSorting,
    columns,
    filterValue,
    filteredItems.length,
    onSearchChange,
    roleFilter,
    rowsPerPage,
    selectedKeys,
    statusFilter,
    visibleColumns,
    actionButton,
    extraTopRight,
    sizeConfig,
    isCompact
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        {/* <span className="w-[30%] text-small text-default-400">
        </span> */}
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button isDisabled={pages === 1} size="sm" variant="shadow" color="default" onPress={onPreviousPage}>
            Anterior
          </Button>
          <Button isDisabled={pages === 1} size="sm" variant="shadow" color="primary" onPress={onNextPage}>
            Siguiente
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages, onPreviousPage, onNextPage]);

  // Función para renderizar las filas con acordeón
  const renderTableBody = () => {
    if (!isAccordion || !accordionContent) {
      return (
        <TableBody
          isLoading={isLoading}
          loadingContent={
            <div className="flex flex-col items-center justify-center mt-20 w-full">
              <Spinner label={loadingLabel} />
            </div>
          }
          items={sortedItems}
          emptyContent={"No hay datos para mostrar."}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey.toString())}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      );
    }

    // Renderizado con acordeón - crear items expandidos
    const expandedItems: any[] = [];

    sortedItems.forEach((item) => {
      // Agregar item principal
      expandedItems.push(item);

      // Agregar item del acordeón si está expandido
      if (expandedRows.has(item.id)) {
        expandedItems.push({
          ...item,
          id: `${item.id}-accordion`,
          isAccordionRow: true,
          originalItem: item
        });
      }
    });

    return (
      <TableBody
        isLoading={isLoading}
        loadingContent={
          <div className="flex flex-col items-center justify-center mt-20 w-full">
            <Spinner label={loadingLabel} />
          </div>
        }
        items={expandedItems}
        emptyContent={"No hay datos para mostrar."}
      >
        {(item) => {
          if (item.isAccordionRow) {
            return (
              <TableRow key={item.id} className="border-none">
                <TableCell colSpan={headerColumns.length} className="py-2 px-0">
                  <div className="w-full bg-default-200 dark:bg-default-200 rounded-b-lg p-4 -my-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-default-200/20 dark:to-default-800/20 rounded-b-lg pointer-events-none"></div>
                    <div className="relative z-10">
                      {accordionContent(item.originalItem)}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          }

          const isRowExpanded = expandedRows.has(item.id);

          return (
            <TableRow
              key={item.id}
              className={isRowExpanded ?
                "bg-default-200 dark:bg-default-200 shadow-inner  border-primary-400 dark:border-primary-600 relative" :
                ""
              }
            >
              {(columnKey) =>
                <TableCell>
                  {renderCell(item, columnKey.toString())}
                </TableCell>}
            </TableRow>
          );
        }}
      </TableBody>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <Table
        isStriped={isStriped}
        key={`table-${expandedRows.size}-${Array.from(expandedRows).join('-')}`}
        aria-label="Dynamic Table"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        className="flex-1 flex flex-col h-full"
        classNames={{
          wrapper: "flex-1 h-full min-h-0 max-h-full overflow-auto",
          th: sizeConfig.cellPaddingY,
          td: sizeConfig.cellPaddingY + " align-middle",
          tr: sizeConfig.rowHeight,
        }}
        selectedKeys={selectedKeys}
        selectionMode={allowRowSelection ? "multiple" : "none"}
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.key === "actions" || column.key === "accordion_toggle" ? "center" : "start"}
              allowsSorting={allowSorting && column.allowsSorting && !excludeFromSorting.includes(column.key)}
              width={column.key === "accordion_toggle" ? 50 : undefined}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        {renderTableBody()}
      </Table>
    </div>
  );
};

export const renderChip = (value: string, color?: ChipProps["color"]) => (
  <Chip color={color} size="sm" variant="flat">
    {value}
  </Chip>
);

export const renderUser = (user: { name: string; email: string; avatar: string }) => (
  <User
    avatarProps={{ radius: "lg", src: user.avatar }}
    description={user.email}
    name={user.name}
  >
    {user.email}
  </User>
);

export const renderActions = (actions: { icon: string; tooltip: string; onClick: () => void }[]) => (
  <div className="relative flex items-center gap-2">
    {actions.map((action, index) => (
      <Tooltip key={index} content={action.tooltip}>
        <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
          <Icon icon={action.icon} onClick={action.onClick} />
        </span>
      </Tooltip>
    ))}
  </div>
);
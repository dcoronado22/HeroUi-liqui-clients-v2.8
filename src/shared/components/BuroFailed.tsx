import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Card, CardBody, Divider, CardFooter } from "@heroui/react";
import { Icon } from "@iconify/react";

const BuroFailed: React.FC<{ overlay?: boolean }> = ({ overlay = false }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => setIsOpen(false);

    if (overlay) {
        return (
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label="Proceso de Buró Fallido"
            >
                <Card className="max-w-lg w-[92vw] sm:w-full shadow-2xl">
                    <CardBody className="gap-4 flex flex-col items-center text-center p-5 text-base">
                        <div className="rounded-full bg-danger-100 p-5 text-danger">
                            <Icon icon="lucide:alert-circle" width={40} height={40} />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-foreground">Proceso de Buró Fallido</h1>
                            <h2 className="text-base text-default-600">No se pudo completar la verificación</h2>
                        </div>

                        <p className="text-default-600 text-sm">
                            Lamentamos informarte que no se pudo completar el proceso de vinculación debido a un
                            problema con la verificación del Buró de Crédito.
                        </p>

                        <div className="w-full">
                            <h3 className="text-base font-semibold text-foreground mb-3 text-left">¿Qué puedes hacer?</h3>
                            <ul className="list-none space-y-2 text-left text-sm">
                                <li className="flex items-start gap-2">
                                    <Icon icon="lucide:check-circle" className="text-primary mt-1" />
                                    <span>Verifica que tu información personal sea correcta</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon="lucide:message-circle" className="text-primary mt-1" />
                                    <span>Contacta a nuestro equipo de soporte</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon="lucide:clock" className="text-primary mt-1" />
                                    <span>Intenta nuevamente en unos minutos</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button color="primary" className="flex-1" startContent={<Icon icon="lucide:refresh-cw" />} >
                                Reintentar
                            </Button>
                            <Button color="default" variant="flat" className="flex-1" startContent={<Icon icon="lucide:headphones" />}>
                                Contactar Soporte
                            </Button>
                        </div>
                    </CardBody>

                    <Divider />

                    <CardFooter className="flex flex-col items-center text-center p-4 text-sm">
                        <h3 className="text-default-600 font-medium mb-4">¿Necesitas ayuda inmediata?</h3>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:phone" className="text-primary" />
                                <span className="font-medium">+52 55 1234-5678</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:mail" className="text-primary" />
                                <span className="font-medium">soporte@empresa.com</span>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="">
            {/* Demo content behind the modal */}
            <div className="text-center">
                <div className="absolute inset-0 bg-black/10 dark:bg-white/5 flex items-center justify-center z-50">
                    <div className="min-h-screen w-full flex items-center justify-center p-2">
                        <Card className={`max-w-lg w-[92vw] sm:w-full shadow-2xl $`}>
                            <CardBody className="gap-4 flex flex-col items-center text-center p-5 text-base">
                                <div className="rounded-full bg-danger-100 p-5 text-danger">
                                    <Icon icon="lucide:alert-circle" width={40} height={40} />
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-xl font-bold text-foreground">Proceso de Buró Fallido</h1>
                                    <h2 className="text-base text-default-600">No se pudo completar la verificación</h2>
                                </div>

                                <p className="text-default-600 text-sm">
                                    Lamentamos informarte que no se pudo completar el proceso de vinculación debido a un
                                    problema con la verificación del Buró de Crédito.
                                </p>

                                <div className="w-full">
                                    <h3 className="text-base font-semibold text-foreground mb-3 text-left">¿Qué puedes hacer?</h3>
                                    <ul className="list-none space-y-2 text-left text-sm">
                                        <li className="flex items-start gap-2">
                                            <Icon icon="lucide:check-circle" className="text-primary mt-1" />
                                            <span>Verifica que tu información personal sea correcta</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Icon icon="lucide:message-circle" className="text-primary mt-1" />
                                            <span>Contacta a nuestro equipo de soporte</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Icon icon="lucide:clock" className="text-primary mt-1" />
                                            <span>Intenta nuevamente en unos minutos</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <Button color="primary" className="flex-1" startContent={<Icon icon="lucide:refresh-cw" />} >
                                        Reintentar
                                    </Button>
                                    <Button color="default" variant="flat" className="flex-1" startContent={<Icon icon="lucide:headphones" />} >
                                        Contactar Soporte
                                    </Button>
                                </div>
                            </CardBody>

                            <Divider />

                            <CardFooter className="flex flex-col items-center text-center p-4 text-sm">
                                <h3 className="text-default-600 font-medium mb-4">¿Necesitas ayuda inmediata?</h3>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="lucide:phone" className="text-primary" />
                                        <span className="font-medium">+52 55 1234-5678</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icon icon="lucide:mail" className="text-primary" />
                                        <span className="font-medium">soporte@empresa.com</span>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Error Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                backdrop="blur"
                placement="center"
                classNames={{
                    backdrop: "bg-black/50"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center border-b border-default-100 pb-4">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-danger-50 mb-2">
                                    <Icon
                                        icon="lucide:alert-circle"
                                        className="text-danger text-3xl"
                                    />
                                </div>
                                <h2 className="text-xl font-bold text-danger">El proceso de Buró falló</h2>
                            </ModalHeader>
                            <ModalBody className="py-5 text-center">
                                <p className="text-default-600">
                                    No puedes continuar con la vinculación. Contacta al administrador o revisa la información requerida.
                                </p>
                            </ModalBody>
                            <ModalFooter className="flex flex-col gap-2">
                                <Button
                                    color="danger"
                                    className="w-full"
                                    onPress={onClose}
                                >
                                    Entendido
                                </Button>
                                <Button
                                    variant="light"
                                    color="default"
                                    className="w-full"
                                    onPress={onClose}
                                >
                                    Contactar soporte
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default BuroFailed;
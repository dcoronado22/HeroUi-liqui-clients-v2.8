import React from 'react';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';

interface StepVerificacionProps {
    onNext?: () => void;
    onPrevious?: () => void;
}

const StepVerificacion: React.FC<StepVerificacionProps> = ({
    onNext,
    onPrevious
}) => {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                <h2 className="text-2xl font-bold">Verificación</h2>
                <p className="text-default-500">Complete la verificación</p>
            </CardHeader>
            <CardBody className="px-6 py-4">
                <div className="space-y-4">
                    <p className="text-sm text-default-600">
                        Por favor, revise la información antes de continuar.
                    </p>

                    <div className="flex gap-2 justify-end">
                        {onPrevious && (
                            <Button
                                variant="bordered"
                                onPress={onPrevious}
                            >
                                Anterior
                            </Button>
                        )}
                        {onNext && (
                            <Button
                                color="primary"
                                onPress={onNext}
                            >
                                Siguiente
                            </Button>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default StepVerificacion;
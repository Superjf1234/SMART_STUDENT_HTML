"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Users, BookOpen, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UniqueCodeGenerator } from '@/lib/unique-codes';
import { useNotificationSync } from '@/hooks/useNotificationSync';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  
  // Sistema de sincronización de notificaciones
  const {
    isEnabled: syncEnabled,
    lastSyncTime,
    stats: syncStats,
    healthScore,
    isLoading: syncLoading,
    error: syncError,
    enable: enableSync,
    disable: disableSync,
    toggle: toggleSync,
    forceSync,
    generateReport,
    checkConsistency,
    clearStats
  } = useNotificationSync();
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationDetails, setMigrationDetails] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin()) {
      router.push('/dashboard');
      toast({
        title: translate('userManagementAccessDenied') || 'Acceso denegado',
        description: translate('userManagementAccessDeniedDesc') || 'No tienes permisos para acceder a esta página',
        variant: 'destructive'
      });
    }
  }, [user, isAdmin, router, toast, translate]);

  // Don't render if not admin
  if (user && !isAdmin()) {
    return null;
  }

  const handleMigrateUniqueCodes = async () => {
    setIsMigrating(true);
    setMigrationStatus('running');
    setMigrationDetails([]);

    try {
      // Get current statistics
      const users = JSON.parse(localStorage.getItem('smart-student-users') || '[]');
      const tasks = JSON.parse(localStorage.getItem('smart-student-tasks') || '[]');
      
      const usersWithoutCodes = users.filter((u: any) => !u.uniqueCode);
      const tasksWithoutCodes = tasks.filter((t: any) => !t.uniqueCode);

      setMigrationDetails(prev => [
        ...prev,
        `🔍 Usuarios sin códigos únicos: ${usersWithoutCodes.length}`,
        `🔍 Tareas sin códigos únicos: ${tasksWithoutCodes.length}`
      ]);

      // Run migration
      UniqueCodeGenerator.migrateExistingData();

      // Get updated statistics
      const updatedUsers = JSON.parse(localStorage.getItem('smart-student-users') || '[]');
      const updatedTasks = JSON.parse(localStorage.getItem('smart-student-tasks') || '[]');

      const usersWithCodes = updatedUsers.filter((u: any) => u.uniqueCode);
      const tasksWithCodes = updatedTasks.filter((t: any) => t.uniqueCode);

      setMigrationDetails(prev => [
        ...prev,
        `✅ Usuarios con códigos únicos: ${usersWithCodes.length}`,
        `✅ Tareas con códigos únicos: ${tasksWithCodes.length}`,
        `🎉 Migración completada exitosamente`
      ]);

      setMigrationStatus('completed');
      
      toast({
        title: "Migración Completada",
        description: "Todos los datos han sido migrados con códigos únicos.",
        variant: "default"
      });

    } catch (error) {
      console.error('Error durante la migración:', error);
      setMigrationStatus('error');
      setMigrationDetails(prev => [
        ...prev,
        `❌ Error durante la migración: ${error}`
      ]);
      
      toast({
        title: "Error en la Migración",
        description: "Hubo un problema durante la migración de códigos únicos.",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const getSystemStatistics = () => {
    const users = JSON.parse(localStorage.getItem('smart-student-users') || '[]');
    const tasks = JSON.parse(localStorage.getItem('smart-student-tasks') || '[]');
    
    return {
      totalUsers: users.length,
      usersWithCodes: users.filter((u: any) => u.uniqueCode).length,
      totalTasks: tasks.length,
      tasksWithCodes: tasks.filter((t: any) => t.uniqueCode).length,
      students: users.filter((u: any) => u.role === 'student').length,
      teachers: users.filter((u: any) => u.role === 'teacher').length,
      evaluations: tasks.filter((t: any) => t.taskType === 'evaluacion').length,
      regularTasks: tasks.filter((t: any) => t.taskType === 'tarea').length
    };
  };

  // Función para forzar sincronización de notificaciones
  const handleForceSync = async () => {
    try {
      await forceSync();
      toast({
        title: "Sincronización completada",
        description: "Las notificaciones han sido sincronizadas exitosamente.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error en sincronización",
        description: "Hubo un problema al sincronizar las notificaciones.",
        variant: "destructive"
      });
    }
  };

  // Función para generar reporte de sincronización
  const handleGenerateReport = () => {
    try {
      const report = generateReport();
      console.log('=== REPORTE DE SINCRONIZACIÓN ===');
      console.log('Timestamp:', report.timestamp);
      console.log('Habilitado:', report.isEnabled);
      console.log('Última sincronización:', report.lastSyncTime);
      console.log('Estadísticas:', report.stats);
      console.log('Datos:', report.data);
      console.log('Problemas encontrados:', report.issues);
      console.log('Puntuación de salud:', report.healthScore);
      console.log('===============================');
      
      toast({
        title: "Reporte generado",
        description: "Revisar la consola para ver los detalles del reporte.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error al generar reporte",
        description: "No se pudo generar el reporte de sincronización.",
        variant: "destructive"
      });
    }
  };

  // Función para verificar consistencia
  const handleCheckConsistency = () => {
    try {
      const consistency = checkConsistency();
      console.log('=== VERIFICACIÓN DE CONSISTENCIA ===');
      console.log('Resultado:', consistency);
      console.log('===================================');
      
      toast({
        title: "Verificación completada",
        description: "Revisar la consola para ver los resultados.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error en verificación",
        description: "No se pudo verificar la consistencia.",
        variant: "destructive"
      });
    }
  };

  // Función para reparación inmediata de notificaciones fantasma
  const handleEmergencyRepair = () => {
    try {
      // Cargar datos actuales
      const notifications = JSON.parse(localStorage.getItem('smart-student-task-notifications') || '[]');
      const tasks = JSON.parse(localStorage.getItem('smart-student-tasks') || '[]');
      const comments = JSON.parse(localStorage.getItem('smart-student-task-comments') || '[]');
      
      let ghostsRemoved = 0;
      let orphansRemoved = 0;
      let validNotifications = [];
      let validComments = [];
      
      // Eliminar notificaciones fantasma
      for (const notification of notifications) {
        const taskExists = tasks.some(task => task.id === notification.taskId);
        if (!taskExists) {
          ghostsRemoved++;
        } else {
          validNotifications.push(notification);
        }
      }
      
      // Eliminar comentarios huérfanos
      for (const comment of comments) {
        const taskExists = tasks.some(task => task.id === comment.taskId);
        if (!taskExists) {
          orphansRemoved++;
        } else {
          validComments.push(comment);
        }
      }
      
      // Guardar datos limpios
      localStorage.setItem('smart-student-task-notifications', JSON.stringify(validNotifications));
      localStorage.setItem('smart-student-task-comments', JSON.stringify(validComments));
      
      // Disparar eventos para actualizar UI
      window.dispatchEvent(new CustomEvent('taskNotificationsUpdated'));
      window.dispatchEvent(new CustomEvent('commentsUpdated'));
      
      toast({
        title: "🔧 Reparación Completada",
        description: `Eliminadas ${ghostsRemoved} notificaciones fantasma y ${orphansRemoved} comentarios huérfanos.`,
        variant: "default"
      });
      
      // Recargar página después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Error en reparación",
        description: "Hubo un problema durante la reparación de emergencia.",
        variant: "destructive"
      });
    }
  };

  const diagnoseCourseAccess = () => {
    console.log('=== DIAGNÓSTICO DE ACCESO A CURSOS ===');
    console.log('Usuario actual:', user);
    
    if (user) {
      console.log('Cursos activos del usuario:', user.activeCourses);
      console.log('Tipo de activeCourses:', typeof user.activeCourses, Array.isArray(user.activeCourses));
    }
    
    // Verificar datos en localStorage
    try {
      const storedUsers = localStorage.getItem('smart-student-users');
      const storedCourses = localStorage.getItem('smart-student-courses');
      
      console.log('Usuarios en localStorage:', storedUsers ? JSON.parse(storedUsers) : 'No hay datos');
      console.log('Cursos en localStorage:', storedCourses ? JSON.parse(storedCourses) : 'No hay datos');
      
      if (storedUsers && user) {
        const users = JSON.parse(storedUsers);
        const currentUserInStorage = users.find((u: any) => u.username === user.username);
        console.log('Usuario actual en localStorage:', currentUserInStorage);
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error);
    }
  };

  const stats = getSystemStatistics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-500" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestión avanzada del sistema Smart Student
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleForceSync}
            disabled={syncLoading}
            variant="outline"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {syncLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sincronizar Notificaciones
          </Button>
          <Button 
            onClick={toggleSync}
            variant="outline"
            className={`${syncEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {syncEnabled ? 'Desactivar' : 'Activar'} Auto-Sync
          </Button>
          <Button 
            onClick={handleGenerateReport}
            variant="outline"
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            📊 Generar Reporte
          </Button>
          <Button 
            onClick={handleEmergencyRepair}
            variant="outline"
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            🔧 Reparación Inmediata
          </Button>
          <Button 
            onClick={() => window.open('/reset-all-tasks.html', '_blank')}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            🗑️ Reset Completo
          </Button>
          <Button 
            onClick={diagnoseCourseAccess}
            variant="outline"
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            🔍 Diagnosticar Cursos
          </Button>
        </div>
      </div>

      {/* Sistema de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.teachers} profesores, {stats.students} estudiantes
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={stats.usersWithCodes === stats.totalUsers ? "default" : "secondary"}>
                {stats.usersWithCodes}/{stats.totalUsers} con códigos únicos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.regularTasks} tareas, {stats.evaluations} evaluaciones
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={stats.tasksWithCodes === stats.totalTasks ? "default" : "secondary"}>
                {stats.tasksWithCodes}/{stats.totalTasks} con códigos únicos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">
              {Math.round(healthScore)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              Salud del sistema
            </div>
            <div className="flex items-center justify-center mt-2">
              <Badge variant={syncEnabled ? "default" : "secondary"}>
                {syncEnabled ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {syncStats.ghostsRemoved} fantasmas eliminados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">
              {syncError ? (
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {syncError ? "Error detectado" : "Sistema OK"}
            </div>
            <div className="flex items-center justify-center mt-2">
              <Badge variant={syncError ? "destructive" : "default"}>
                {syncStats.totalSyncs} sincronizaciones
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {lastSyncTime ? `Última: ${new Date(lastSyncTime).toLocaleTimeString()}` : "Sin sincronizar"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {migrationStatus === 'idle' && <span className="text-gray-500">Listo</span>}
              {migrationStatus === 'running' && <span className="text-blue-500">Ejecutando</span>}
              {migrationStatus === 'completed' && <span className="text-green-500">Completado</span>}
              {migrationStatus === 'error' && <span className="text-red-500">Error</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Sistema de migración
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migración de Códigos Únicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Migración de Códigos Únicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Asigna códigos únicos a todos los usuarios, tareas y evaluaciones del sistema.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta operación es segura y no afecta los datos existentes.
              </p>
            </div>
            <Button 
              onClick={handleMigrateUniqueCodes}
              disabled={isMigrating}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Ejecutar Migración
                </>
              )}
            </Button>
          </div>

          {/* Detalles de la migración */}
          {migrationDetails.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center">
                {migrationStatus === 'running' && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                {migrationStatus === 'completed' && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
                {migrationStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2 text-red-500" />}
                Detalles de la Migración
              </h4>
              <div className="space-y-1 text-sm font-mono">
                {migrationDetails.map((detail, index) => (
                  <div key={index} className="text-muted-foreground">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Códigos Únicos Implementados</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• TCH-XXXXXXXX - Códigos para profesores</li>
                <li>• STU-XXXXXXXX - Códigos para estudiantes</li>
                <li>• TSK-XXXXXXXX - Códigos para tareas</li>
                <li>• EVL-XXXXXXXX - Códigos para evaluaciones</li>
                <li>• CRS-XXXXXXXX - Códigos para cursos (futuro)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Características</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Códigos de 8 caracteres alfanuméricos</li>
                <li>• Basados en timestamp para unicidad</li>
                <li>• Validación automática de formato</li>
                <li>• Migración automática de datos legacy</li>
                <li>• Referencia interna para integridad</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

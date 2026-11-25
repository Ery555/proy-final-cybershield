% ==============================================================================
% BASE DE CONOCIMIENTOS: POLÍTICAS DE FIREWALL Y ZERO-TRUST (CyberShield SOC)
% ==============================================================================

% 1. HECHOS: TOPOLOGÍA Y RUTAS AUTORIZADAS
% allowed_route(ZonaOrigen, NodoDestino, PuertoDestino).

allowed_route(external, web_server, 80).
allowed_route(external, web_server, 443).
allowed_route(external, api_gateway, 443).
allowed_route(external, auth_service, 443).

allowed_route(dmz, api_gateway, 443).
allowed_route(dmz, auth_service, 443).
allowed_route(dmz, db_server, 5432).

allowed_route(internal, db_server, 5432).
allowed_route(internal, auth_service, 22).
allowed_route(internal, web_server, 22).
allowed_route(internal, api_gateway, 22).

% Activos críticos que requieren aislamiento estricto
critical_asset(db_server).
critical_asset(auth_service).

% ==============================================================================
% 2. REGLAS DE AUDITORÍA DETERMINISTA
% evaluate_flow(SrcZone, DstNode, DstPort, FailedLogins, BytesRec, Pps,
%               Status, RuleName, Explanation)
% ==============================================================================

% Regla 1: Ninguna IP externa puede conectar directamente a la Base de Datos
evaluate_flow(external, db_server, _, _, _, _,
              violation,
              violacion_zero_trust_acceso_directo_db,
              'Origen externo intento conectar directamente a db_server sin pasar por API/DMZ.') :- !.

% Regla 2: Administración remota (SSH puerto 22) restringida solo a red interna
evaluate_flow(SrcZone, _, 22, _, _, _,
              violation,
              violacion_puerto_administrativo_externo,
              'Intento de acceso administrativo SSH (puerto 22) desde fuera de la zona interna.') :-
    SrcZone \= internal, !.

% Regla 3: Cualquier combinación Zona -> Nodo -> Puerto no declarada está bloqueada por defecto
evaluate_flow(SrcZone, DstNode, DstPort, _, _, _,
              violation,
              ruta_no_autorizada_firewall,
              'Trafico bloqueado por politica Deny-by-Default: ruta o puerto no autorizado.') :-
    \+ allowed_route(SrcZone, DstNode, DstPort), !.

% Regla 4: Política de bloqueo automático por intentos fallidos de autenticación
evaluate_flow(_, _, _, FailedLogins, _, _,
              violation,
              bloqueo_fuerza_bruta_umbral,
              'Se supero el umbral de 5 intentos fallidos de autenticacion en una misma sesion.') :-
    FailedLogins >= 5, !.

% Regla 5: Prevención de exfiltración masiva desde activos críticos
evaluate_flow(_, DstNode, _, _, BytesRec, _,
              violation,
              alerta_exfiltracion_volumen_db,
              'Transferencia saliente superior a 50 KB desde un activo critico detectada.') :-
    critical_asset(DstNode),
    BytesRec > 50000, !.

% Regla 6: Protección contra inundación volumétrica de paquetes por segundo
evaluate_flow(_, _, _, _, _, Pps,
              violation,
              mitigacion_flood_volumetrico,
              'Tasa de paquetes por segundo excede el limite fisico permitido por interfaz (800 PPS).') :-
    Pps > 800, !.

% Regla por defecto: El flujo cumple todas las políticas de seguridad
evaluate_flow(_, _, _, _, _, _,
              compliant,
              politica_cumplida,
              'Flujo permitido bajo politica Zero-Trust.') :- !.

% ==============================================================================
% 3. PREDICADO DE CONSULTA PARA PYTHON (pyswip)
% Devuelve soluciones únicamente cuando Status == violation
% ==============================================================================

is_violation(SrcZone, DstNode, DstPort, FailedLogins, BytesRec, Pps, RuleName, Explanation) :-
    evaluate_flow(SrcZone, DstNode, DstPort, FailedLogins, BytesRec, Pps,
                  violation, RuleName, Explanation).
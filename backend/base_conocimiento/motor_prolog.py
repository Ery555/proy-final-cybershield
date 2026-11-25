from pathlib import Path
from pyswip import Prolog


class MotorProlog:
    """Interfaz entre Python y la base de conocimientos Zero-Trust en SWI-Prolog."""

    def __init__(self, nombre_archivo: str = "politicas_firewall.pl"):
        self.prolog = Prolog()
        ruta_pl = Path(__file__).resolve().parent / nombre_archivo

        if not ruta_pl.exists():
            raise FileNotFoundError(
                f"No se encontró la base de conocimientos en: {ruta_pl}"
            )

        # as_posix() evita errores con barras invertidas en SWI-Prolog bajo Windows
        self.prolog.consult(ruta_pl.as_posix())

    def auditar_flujo(
        self,
        src_zone: str,
        dst_node: str,
        dst_port: int,
        failed_logins: int,
        bytes_received: float,
        packets_per_sec: float,
    ) -> dict:
        """Evalúa el flujo contra las reglas deterministas del firewall."""
        zona = src_zone.strip().lower()
        nodo = dst_node.strip().lower()

        consulta = (
            f"is_violation({zona}, {nodo}, {int(dst_port)}, "
            f"{int(failed_logins)}, {float(bytes_received)}, "
            f"{float(packets_per_sec)}, RuleName, Explanation)"
        )

        resultados = list(self.prolog.query(consulta))

        if resultados:
            primero = resultados[0]
            regla = primero["RuleName"]
            explicacion = primero["Explanation"]

            if isinstance(regla, bytes):
                regla = regla.decode("utf-8")
            if isinstance(explicacion, bytes):
                explicacion = explicacion.decode("utf-8")

            return {
                "policy_violated": True,
                "triggered_rule": str(regla),
                "explanation": str(explicacion),
            }

        return {
            "policy_violated": False,
            "triggered_rule": "politica_cumplida",
            "explanation": "Flujo permitido bajo politica Zero-Trust.",
        }
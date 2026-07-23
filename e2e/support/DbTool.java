import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class DbTool {
    public static void main(String[] args) throws Exception {
        if (args.length < 4) {
            throw new IllegalArgumentException("Usage: DbTool <operation> <jdbcUrl> <username> <password> ...");
        }

        String operation = args[0];
        String jdbcUrl = args[1];
        String username = args[2];
        String password = args[3];

        try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password)) {
            connection.setAutoCommit(false);
            try {
                switch (operation) {
                    case "create-department" -> createDepartment(connection, args);
                    case "create-employee" -> createEmployee(connection, args);
                    case "create-salary" -> createSalary(connection, args);
                    case "create-salary-template" -> createSalaryTemplate(connection, args);
                    case "create-employee-salary" -> createEmployeeSalary(connection, args);
                    case "set-password" -> setPassword(connection, args);
                    case "insert-pay-rates" -> insertPayRates(connection, args);
                    default -> throw new IllegalArgumentException("Unsupported operation: " + operation);
                }
                connection.commit();
            } catch (Exception ex) {
                connection.rollback();
                throw ex;
            }
        }
    }

    private static void createEmployeeSalary(Connection connection, String[] args) throws Exception {
        if (args.length != 13) {
            throw new IllegalArgumentException(
                    "Usage: DbTool create-employee-salary <jdbcUrl> <username> <password> <hrEmail> <employeeSalaryCode> <userProfileCode> <templateCode> <effectiveFrom> <effectiveTo> <totalAmount> <baseSalaryCode> <allowanceSalaryCode>");
        }

        String hrEmail = args[4];
        String employeeSalaryCode = args[5];
        String userProfileCode = args[6];
        String templateCode = args[7];
        LocalDate effectiveFrom = LocalDate.parse(args[8]);
        LocalDate effectiveTo = LocalDate.parse(args[9]);
        String totalAmount = args[10];
        String baseSalaryCode = args[11];
        String allowanceSalaryCode = args[12];
        AccountAudit audit = loadAccountAudit(connection, hrEmail);
        String secretKey = loadCompanySecretKey(connection, audit.companyCode());

        if (!employeeSalaryExists(connection, employeeSalaryCode)) {
            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into employee_salary (
                        id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                        user_profile_code, template_code, effective_from, effective_to, total_amount, currency, salary_basis_type
                    ) values ((select coalesce(max(id), 0) + 1 from employee_salary), ?, ?, now(), now(), ?, ?, false, ?, ?, ?, ?, ?, 'VND', 'WORKING_HOUR')
                    """)) {
                statement.setString(1, employeeSalaryCode);
                statement.setString(2, audit.companyCode());
                statement.setString(3, audit.accountCode());
                statement.setString(4, audit.accountCode());
                statement.setString(5, userProfileCode);
                statement.setString(6, templateCode);
                statement.setObject(7, effectiveFrom);
                statement.setObject(8, effectiveTo);
                statement.setString(9, encryptCompanySecret(totalAmount, secretKey));
                statement.executeUpdate();
            }

            insertEmployeeSalaryDetail(connection, audit, employeeSalaryCode, "ESD-" + employeeSalaryCode + "-BASE",
                    baseSalaryCode, "20000000");
            insertEmployeeSalaryDetail(connection, audit, employeeSalaryCode, "ESD-" + employeeSalaryCode + "-ALLOW",
                    allowanceSalaryCode, "2000000");
        }

        System.out.println(employeeSalaryCode);
    }

    private static void insertEmployeeSalaryDetail(Connection connection, AccountAudit audit, String employeeSalaryCode,
            String detailCode, String salaryCode, String amount) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("""
                insert into employee_salary_detail (
                    id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                    salary_code, employee_salary_code, amount, day_type, is_fixed, salary_unit_type
                ) values ((select coalesce(max(id), 0) + 1 from employee_salary_detail), ?, ?, now(), now(), ?, ?, false, ?, ?, ?, 0, true, 'HOUR')
                """)) {
            statement.setString(1, detailCode);
            statement.setString(2, audit.companyCode());
            statement.setString(3, audit.accountCode());
            statement.setString(4, audit.accountCode());
            statement.setString(5, salaryCode);
            statement.setString(6, employeeSalaryCode);
            statement.setString(7, amount);
            statement.executeUpdate();
        }
    }

    private static void createSalaryTemplate(Connection connection, String[] args) throws Exception {
        if (args.length != 12) {
            throw new IllegalArgumentException(
                    "Usage: DbTool create-salary-template <jdbcUrl> <username> <password> <hrEmail> <templateCode> <name> <totalAmount> <effectiveFrom> <effectiveTo> <baseSalaryCode> <allowanceSalaryCode>");
        }

        String hrEmail = args[4];
        String templateCode = args[5];
        String name = args[6];
        BigDecimal totalAmount = new BigDecimal(args[7]);
        LocalDate effectiveFrom = LocalDate.parse(args[8]);
        LocalDate effectiveTo = LocalDate.parse(args[9]);
        String baseSalaryCode = args[10];
        String allowanceSalaryCode = args[11];
        AccountAudit audit = loadAccountAudit(connection, hrEmail);

        if (!salaryTemplateExists(connection, templateCode)) {
            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into salary_template (
                        id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                        name, description, total_amount, effective_from, effective_to, currency
                    ) values ((select coalesce(max(id), 0) + 1 from salary_template), ?, ?, now(), now(), ?, ?, false, ?, ?, ?, ?, ?, 'VND')
                    """)) {
                statement.setString(1, templateCode);
                statement.setString(2, audit.companyCode());
                statement.setString(3, audit.accountCode());
                statement.setString(4, audit.accountCode());
                statement.setString(5, name);
                statement.setString(6, "Automation payroll template");
                statement.setBigDecimal(7, totalAmount);
                statement.setObject(8, effectiveFrom);
                statement.setObject(9, effectiveTo);
                statement.executeUpdate();
            }

            insertSalaryTemplateDetail(connection, audit, templateCode, "STD-" + templateCode + "-BASE", baseSalaryCode,
                    "20000000", 1);
            insertSalaryTemplateDetail(connection, audit, templateCode, "STD-" + templateCode + "-ALLOW",
                    allowanceSalaryCode, "2000000", 2);
        }

        System.out.println(templateCode);
    }

    private static void insertSalaryTemplateDetail(Connection connection, AccountAudit audit, String templateCode,
            String detailCode, String salaryCode, String amount, int sequenceOrder) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("""
                insert into salary_template_detail (
                    id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                    template_code, salary_code, amount, quantity, unit_code, sequence_order, is_fixed
                ) values ((select coalesce(max(id), 0) + 1 from salary_template_detail), ?, ?, now(), now(), ?, ?, false, ?, ?, ?, 1, 'MONTH', ?, true)
                """)) {
            statement.setString(1, detailCode);
            statement.setString(2, audit.companyCode());
            statement.setString(3, audit.accountCode());
            statement.setString(4, audit.accountCode());
            statement.setString(5, templateCode);
            statement.setString(6, salaryCode);
            statement.setString(7, amount);
            statement.setInt(8, sequenceOrder);
            statement.executeUpdate();
        }
    }

    private static void createSalary(Connection connection, String[] args) throws Exception {
        if (args.length != 9) {
            throw new IllegalArgumentException(
                    "Usage: DbTool create-salary <jdbcUrl> <username> <password> <hrEmail> <salaryCode> <name> <calculateMethod> <isDeduct>");
        }

        String hrEmail = args[4];
        String salaryCode = args[5];
        String name = args[6];
        String calculateMethod = args[7];
        boolean isDeduct = Boolean.parseBoolean(args[8]);
        AccountAudit audit = loadAccountAudit(connection, hrEmail);

        try (PreparedStatement exists = connection.prepareStatement(
                "select code from salary where code = ? and is_deleted = false")) {
            exists.setString(1, salaryCode);
            try (ResultSet resultSet = exists.executeQuery()) {
                if (resultSet.next()) {
                    System.out.println(resultSet.getString("code"));
                    return;
                }
            }
        }

        try (PreparedStatement statement = connection.prepareStatement("""
                insert into salary (
                    id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                    name, calculate_method, is_deduct
                ) values ((select coalesce(max(id), 0) + 1 from salary), ?, ?, now(), now(), ?, ?, false, ?, ?, ?)
                """)) {
            statement.setString(1, salaryCode);
            statement.setString(2, audit.companyCode());
            statement.setString(3, audit.accountCode());
            statement.setString(4, audit.accountCode());
            statement.setString(5, name);
            statement.setString(6, calculateMethod);
            statement.setBoolean(7, isDeduct);
            statement.executeUpdate();
        }

        System.out.println(salaryCode);
    }

    private static void createEmployee(Connection connection, String[] args) throws Exception {
        if (args.length != 12) {
            throw new IllegalArgumentException(
                    "Usage: DbTool create-employee <jdbcUrl> <username> <password> <hrEmail> <accountCode> <userProfileCode> <email> <firstName> <lastName> <departmentCode> <phone>");
        }

        String hrEmail = args[4];
        String accountCode = args[5];
        String userProfileCode = args[6];
        String email = args[7];
        String firstName = args[8];
        String lastName = args[9];
        String departmentCode = args[10];
        String phone = args[11];
        AccountAudit audit = loadAccountAudit(connection, hrEmail);
        String roleCode = loadEmployeeRoleCode(connection, audit.companyCode());

        if (!accountExists(connection, accountCode)) {
            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into account (
                        id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                        email, password_hash, is_active, last_login, role_code
                    ) values ((select coalesce(max(id), 0) + 1 from account), ?, ?, now(), now(), ?, ?, false, ?, ?, true, now(), ?)
                    """)) {
                statement.setString(1, accountCode);
                statement.setString(2, audit.companyCode());
                statement.setString(3, audit.accountCode());
                statement.setString(4, audit.accountCode());
                statement.setString(5, email);
                statement.setString(6, DEFAULT_TEST_PASSWORD_BCRYPT);
                statement.setString(7, roleCode);
                statement.executeUpdate();
            }
        }

        if (!userProfileExists(connection, userProfileCode)) {
            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into user_profile (
                        id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                        account_code, first_name, last_name, department_code, employee_number,
                        phone_number, hire_date, is_active
                    ) values ((select coalesce(max(id), 0) + 1 from user_profile), ?, ?, now(), now(), ?, ?, false, ?, ?, ?, ?, ?, ?, current_date, true)
                    """)) {
                statement.setString(1, userProfileCode);
                statement.setString(2, audit.companyCode());
                statement.setString(3, audit.accountCode());
                statement.setString(4, audit.accountCode());
                statement.setString(5, accountCode);
                statement.setString(6, firstName);
                statement.setString(7, lastName);
                statement.setString(8, departmentCode);
                statement.setString(9, userProfileCode);
                statement.setString(10, phone);
                statement.executeUpdate();
            }
        }

        System.out.println(userProfileCode);
    }

    private static void createDepartment(Connection connection, String[] args) throws Exception {
        if (args.length != 8) {
            throw new IllegalArgumentException(
                    "Usage: DbTool create-department <jdbcUrl> <username> <password> <hrEmail> <departmentCode> <name> <description>");
        }

        String hrEmail = args[4];
        String departmentCode = args[5];
        String name = args[6];
        String description = args[7];
        AccountAudit audit = loadAccountAudit(connection, hrEmail);

        try (PreparedStatement exists = connection.prepareStatement(
                "select code from department where code = ? and is_deleted = false")) {
            exists.setString(1, departmentCode);
            try (ResultSet resultSet = exists.executeQuery()) {
                if (resultSet.next()) {
                    System.out.println(resultSet.getString("code"));
                    return;
                }
            }
        }

        try (PreparedStatement statement = connection.prepareStatement("""
                insert into department (
                    id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                    name, description, status
                ) values ((select coalesce(max(id), 0) + 1 from department), ?, ?, now(), now(), ?, ?, false, ?, ?, 0)
                """)) {
            statement.setString(1, departmentCode);
            statement.setString(2, audit.companyCode());
            statement.setString(3, audit.accountCode());
            statement.setString(4, audit.accountCode());
            statement.setString(5, name);
            statement.setString(6, description);
            statement.executeUpdate();
        }

        System.out.println(departmentCode);
    }

    private static void setPassword(Connection connection, String[] args) throws Exception {
        if (args.length != 6) {
            throw new IllegalArgumentException("Usage: DbTool set-password <jdbcUrl> <username> <password> <email> <bcryptHash>");
        }

        String email = args[4];
        String bcryptHash = args[5];
        try (PreparedStatement statement = connection.prepareStatement(
                "update account set password_hash = ?, last_login = now(), updated_at = now() where email = ?")) {
            statement.setString(1, bcryptHash);
            statement.setString(2, email);
            int updated = statement.executeUpdate();
            if (updated != 1) {
                throw new IllegalStateException("Expected to update 1 account, updated " + updated + " for " + email);
            }
        }
    }

    private static void insertPayRates(Connection connection, String[] args) throws Exception {
        if (args.length != 8) {
            throw new IllegalArgumentException(
                    "Usage: DbTool insert-pay-rates <jdbcUrl> <username> <password> <policyCode> <codePrefix> <effectiveFrom> <effectiveTo>");
        }

        String policyCode = args[4];
        String codePrefix = args[5];
        LocalDate effectiveFrom = LocalDate.parse(args[6]);
        LocalDate effectiveTo = LocalDate.parse(args[7]);

        PolicyAudit policy = loadPolicyAudit(connection, policyCode);
        Map<String, BigDecimal> rates = Map.of(
                "NORMAL", new BigDecimal("1.00"),
                "WEEKEND", new BigDecimal("2.00"),
                "HOLIDAY", new BigDecimal("3.00"));

        for (Map.Entry<String, BigDecimal> entry : rates.entrySet()) {
            if (payRateExists(connection, policyCode, entry.getKey())) {
                continue;
            }

            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into pay_rate_rule (
                        id, code, company_code, created_at, updated_at, created_by, updated_by, is_deleted,
                        policy_code, day_type, multiplier, applies_to, effective_from, effective_to
                    ) values ((select coalesce(max(id), 0) + 1 from pay_rate_rule), ?, ?, now(), now(), ?, ?, false, ?, ?, ?, 'ALL_EARNINGS', ?, ?)
                    """)) {
                statement.setString(1, codePrefix + "-" + entry.getKey());
                statement.setString(2, policy.companyCode());
                statement.setString(3, policy.createdBy());
                statement.setString(4, policy.createdBy());
                statement.setString(5, policyCode);
                statement.setString(6, entry.getKey());
                statement.setBigDecimal(7, entry.getValue());
                statement.setObject(8, effectiveFrom);
                statement.setObject(9, effectiveTo);
                statement.executeUpdate();
            }
        }
    }

    private static PolicyAudit loadPolicyAudit(Connection connection, String policyCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select company_code, created_by from payroll_policy where code = ? and is_deleted = false")) {
            statement.setString(1, policyCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("Payroll policy not found: " + policyCode);
                }
                return new PolicyAudit(resultSet.getString("company_code"), resultSet.getString("created_by"));
            }
        }
    }

    private static AccountAudit loadAccountAudit(Connection connection, String email) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select code, company_code from account where email = ? and is_deleted = false")) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("Account not found: " + email);
                }
                return new AccountAudit(resultSet.getString("code"), resultSet.getString("company_code"));
            }
        }
    }

    private static String loadEmployeeRoleCode(Connection connection, String companyCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("""
                select code
                from role
                where is_deleted = false
                  and (code = 'EMPLOYEE' or name = 'EMPLOYEE' or type = 'EMPLOYEE')
                  and (company_code = ? or company_code is null)
                order by case when company_code = ? then 0 else 1 end
                limit 1
                """)) {
            statement.setString(1, companyCode);
            statement.setString(2, companyCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("EMPLOYEE role not found");
                }
                return resultSet.getString("code");
            }
        }
    }

    private static boolean accountExists(Connection connection, String accountCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select count(*) from account where code = ? and is_deleted = false")) {
            statement.setString(1, accountCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        }
    }

    private static boolean userProfileExists(Connection connection, String userProfileCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select count(*) from user_profile where code = ? and is_deleted = false")) {
            statement.setString(1, userProfileCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        }
    }

    private static boolean salaryTemplateExists(Connection connection, String templateCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select count(*) from salary_template where code = ? and is_deleted = false")) {
            statement.setString(1, templateCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        }
    }

    private static boolean employeeSalaryExists(Connection connection, String employeeSalaryCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select count(*) from employee_salary where code = ? and is_deleted = false")) {
            statement.setString(1, employeeSalaryCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        }
    }

    private static String loadCompanySecretKey(Connection connection, String companyCode) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select secret_key from company where code = ? and is_deleted = false")) {
            statement.setString(1, companyCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("Company not found: " + companyCode);
                }
                return resultSet.getString("secret_key");
            }
        }
    }

    private static String encryptCompanySecret(String plainText, String companySecretKey) throws Exception {
        byte[] iv = new byte[12];
        SECURE_RANDOM.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, deriveAesKey(companySecretKey), new GCMParameterSpec(128, iv));

        byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        byte[] packed = ByteBuffer.allocate(iv.length + cipherText.length).put(iv).put(cipherText).array();
        return Base64.getEncoder().encodeToString(packed);
    }

    private static SecretKey deriveAesKey(String companySecretKey) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(companySecretKey.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(hash, 0, 16, "AES");
    }

    private static boolean payRateExists(Connection connection, String policyCode, String dayType) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select count(*) from pay_rate_rule where policy_code = ? and day_type = ? and is_deleted = false")) {
            statement.setString(1, policyCode);
            statement.setString(2, dayType);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        }
    }

    private record PolicyAudit(String companyCode, String createdBy) {
    }

    private record AccountAudit(String accountCode, String companyCode) {
    }

    private static final String DEFAULT_TEST_PASSWORD_BCRYPT =
            "$2a$10$ZD4SqDW1G8CCwMeKTt3mdu/Di7T3d5wR.p3xEvfvMhtqTwxl8Wg8i";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
}

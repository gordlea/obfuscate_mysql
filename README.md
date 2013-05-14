# obfuscate_mysql

This is a simple util I use to obfuscate data in mysql tables for development purposes. It is very simple but it meets my needs. It should not be considered production quality code (it was written as fast as possible), although this may change as I have time to refactor it.

```bash
Usage: obfuscate_mysql [OPTIONS] --database <database> --config <path/to/config.json>
Options:
   --username=<mysql_username>         Your username for mysql. Defaults to root.
   --password=<mysql_password>         Your password for mysql. Defaults to blank.
   --host=<mysql_host_address>         The address for mysql. Defaults to localhost.

Config file format:
{
    "tables": [{
        "name": "Address",
        "configs": [{
            "where": "AddressCountryId = 2",
            "id": "AddressId",
            "AddressStreetLine1": "fake_address_US.StreetAddress",
            "AddressStreetLine2": "null",
            "AddressCity": "fake_address_US.City",
            "AddressProvince": "fake_address_US.State",
            "AddressPostalCode": "fake_address_US.ZipCode",
            "AddressCountryId": "fake_address_US.Country",
            "Phone": "fake_address_US.TelephoneNumber",
            "ContactPersonFirstName": "fake_address_US.GivenName",
            "ContactPersonLastName": "fake_address_US.Surname"
        },{
            "where": "AddressCountryId = 1",
            "id": "AddressId",
            "AddressStreetLine1": "fake_address_CA.StreetAddress",
            "AddressStreetLine2": "null",
            "AddressCity": "fake_address_CA.City",
            "AddressProvince": "fake_address_CA.State",
            "AddressPostalCode": "fake_address_CA.ZipCode",
            "AddressCountryId": "fake_address_CA.Country",
            "Phone": "fake_address_CA.TelephoneNumber",
            "ContactPersonFirstName": "fake_address_CA.GivenName",
            "ContactPersonLastName": "fake_address_CA.Surname"
        }]
    },{
        "name": "Person",
        "configs": [{
            "where": "",
            "id": "PersonId",
            "PersonFirstName": "fake_person.GivenName",
            "PersonLastName": "fake_person.Surname",
            "company": "fake_person.Company",
            "phone": "fake_person.TelephoneNumber"
        }]
    }]
}
```